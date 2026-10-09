import React,{useEffect,useState} from 'react';
import {Filter,ChevronRight} from 'lucide-react';
import {Card} from './market-context.jsx';
import InfoModal,{Section} from './info-modal.jsx';
import EtfTicker from './etf-ticker.jsx';
import {rsText} from '../server/sector-flow.js';
import {volText,flowText} from '../server/fund-flow.js';
const sectorKo={'Information Technology':'정보기술',Financials:'금융',Energy:'에너지','Health Care':'헬스케어','Consumer Discretionary':'경기소비재','Consumer Staples':'필수소비재',Industrials:'산업재',Materials:'소재',Utilities:'유틸리티','Real Estate':'부동산','Communication Services':'커뮤니케이션'};
const etTime=t=>new Date(t).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hour12:false});
const kst=t=>new Date(t).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
const verdictClass={유리:'good',중립:'mid',불리:'bad'};
// Macro → sector → crowded trading → watch list, in one card. Observation, not a recommendation.
export default function Funnel(){
 const [data,setData]=useState(null),[error,setError]=useState(''),[pick,setPick]=useState(null);
 useEffect(()=>{fetch('/data/pulse/funnel.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(Error(r.status===404?'첫 수집 후 표시돼요.':`HTTP ${r.status}`))).then(setData).catch(e=>setError(e.message))},[]);
 const sec=pick&&data?.sectors.find(s=>s.id===pick);
 return <Card icon={Filter} title="오늘의 흐름" sub="거시 국면 → 유리한 섹터 → 그 안에 거래가 몰리는 종목" meta={data&&`${kst(data.updatedAt)} 갱신`} className="funnel">
  {!data?<p className="fine">{error||'불러오는 중'}</p>:<>
  <div className="fn-step"><span className="fn-no">1</span><div><h3>거시 국면</h3><div className="fn-tags">{data.regime.map(r=><span key={r}>{r}</span>)}</div></div></div>
  <div className="fn-step"><span className="fn-no">2</span><div><h3>섹터 <small>거시 규칙 + 1개월·1주 상대 강도 + 지난 1시간 자금 흐름</small></h3>
   <div className="fn-sectors">{data.sectors.map(s=><button type="button" key={s.id} className={`fn-sector ${verdictClass[s.verdict]} ${data.favored.includes(s.id)?'is-fav':''}`} onClick={()=>setPick(s.id)} aria-haspopup="dialog">
    <span className="fn-sector-head"><strong>{s.name}</strong><em>{s.verdict}{s.confirmed?' ✓':''}</em></span>
    <small>{rsText[s.rs1m]||'—'}</small><small>{s.flow?`${flowText[s.flow.dir]} · ${volText[s.flow.vol]}`:'최근 1시간 거래 없음'}</small></button>)}</div>
   <p className="fine">✓ 표시는 거시 규칙이 유리하다고 본 섹터에 실제로 돈이 들어오고 있다는 뜻이에요. 섹터를 누르면 근거가 보여요.</p></div></div>
  <div className="fn-step"><span className="fn-no">3</span><div><h3>관찰 종목 <small>{data.favored.map(id=>sectorKo[id]).join(' · ')||'유리한 섹터 없음'} 안에서</small></h3>
   {!data.picks.length?<p className="fine">유리한 섹터 안에서 기준을 넘은 종목이 아직 없어요.</p>:<div className="active-grid">{data.picks.map((p,i)=><article key={p.symbol} className="active-card"><header><span className="active-rank">{i+1}</span><EtfTicker symbol={p.symbol} name={p.name}/>{p.dir&&<span className={`active-dir ${p.dir}`}>{p.dir==='up'?'▲':p.dir==='down'?'▼':'–'}</span>}</header>
    <p className="active-name">{p.name}<small>{sectorKo[p.sector]}</small></p>
    {p.basis==='거래 집중'?<dl><dt>체결강도</dt><dd>{p.strength}</dd><dt>거래량</dt><dd>{p.volume}</dd><dt>VWAP</dt><dd>{p.vwap==='above'?'위':p.vwap==='below'?'아래':'—'}</dd></dl>:<dl><dt>근거</dt><dd>{data.report?`${data.report.date} 리포트`:'리포트'}</dd><dt>Driver</dt><dd>{p.drivers.join(' · ')||'—'}</dd></dl>}
    <span className="fn-chain">{data.regime[0]} → {sectorKo[p.sector]} {data.sectors.find(s=>s.id===p.sector)?.verdict} → {p.basis}</span></article>)}</div>}
  </div></div>
  <p className="fine">거래 집중: 정규장에서 16분 이상 지난 마지막 5분 기준{data.active?.at?`(${etTime(data.active.at)} ET)`:''} · 거래량은 20거래일 같은 시각 대비, 체결강도는 체결 방향 추정, VWAP는 당일 누적 기준. 리포트 근거: 최근 일일 리포트의 판단 후보. 투자 권유가 아닌 관측 기록입니다.</p>
  </>}
  <InfoModal open={sec} onClose={()=>setPick(null)} title={sec&&`${sec.name} (${sec.etf})`} badge={sec&&<span className={`fn-badge ${verdictClass[sec.verdict]}`}>{sec.verdict}{sec.confirmed?' · 자금 확인':''}</span>}>{sec&&<>
   <Section title="거시 규칙이 본 이유">{sec.macro.plus.length+sec.macro.minus.length===0?<p>지금 국면에서 이 섹터에 해당하는 규칙이 없어요.</p>:<ul>{sec.macro.plus.map(r=><li key={r}>유리 · {r}</li>)}{sec.macro.minus.map(r=><li key={r}>불리 · {r}</li>)}</ul>}</Section>
   <Section title="실제 돈의 움직임"><ul><li>최근 1개월: {rsText[sec.rs1m]||'자료 없음'}</li><li>최근 1주: {rsText[sec.rs1w]||'자료 없음'}</li><li>지난 1시간: {sec.flow?`${flowText[sec.flow.dir]} · ${volText[sec.flow.vol]}`:'거래 없음'}</li></ul></Section>
   <Section title="대표 ETF"><p><EtfTicker symbol={sec.etf} name={`${sec.name} 섹터`} variant="chip"/></p></Section></>}</InfoModal>
 </Card>;
}
