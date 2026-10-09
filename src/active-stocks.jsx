import React,{useEffect,useState} from 'react';
import {Flame} from 'lucide-react';
import {Card} from './market-context.jsx';
import EtfTicker from './etf-ticker.jsx';
const sectorKo={'Information Technology':'정보기술',Financials:'금융',Energy:'에너지','Health Care':'헬스케어','Consumer Discretionary':'경기소비재','Consumer Staples':'필수소비재',Industrials:'산업재',Materials:'소재',Utilities:'유틸리티','Real Estate':'부동산','Communication Services':'커뮤니케이션'};
const etTime=t=>new Date(t).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hour12:false});
const kst=t=>new Date(t).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
// Five S&P 500 stocks where 5-minute volume and buy-side trade strength stand out. Observation, not a pick.
export default function ActiveStocks(){
 const [data,setData]=useState(null),[error,setError]=useState('');
 useEffect(()=>{fetch('/data/pulse/active.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(Error(r.status===404?'첫 정규장 수집 후 표시돼요.':`HTTP ${r.status}`))).then(setData).catch(e=>setError(e.message))},[]);
 const at=data?.barStart;
 return <Card icon={Flame} title="지금 거래가 몰리는 종목" sub="S&P 500 중 5분 거래량이 평소보다 크게 늘고 매수 체결이 우세한 종목" meta={at&&`${etTime(at)}~${etTime(Date.parse(at)+3e5)} ET 5분 · ${kst(data.updatedAt)} 갱신`}>
  {!data?<p className="fine">{error||'불러오는 중'}</p>:!data.items.length?<p className="fine">이번 정규장 확인에서 기준(평소 1.5배 이상 거래 · 매수 우위)을 넘은 종목이 없었어요.</p>:
  <div className="active-grid">{data.items.map((s,i)=><article key={s.symbol} className="active-card"><header><span className="active-rank">{i+1}</span><EtfTicker symbol={s.symbol} name={s.name}/><span className={`active-dir ${s.dir}`}>{s.dir==='up'?'▲':s.dir==='down'?'▼':'–'}</span></header>
   <p className="active-name">{s.name}<small>{sectorKo[s.sector]||s.sector}</small></p>
   <dl><dt>체결강도</dt><dd>{s.strength}</dd><dt>거래량</dt><dd>{s.volume}</dd><dt>VWAP</dt><dd>{s.vwap==='above'?'위':s.vwap==='below'?'아래':'—'}</dd></dl></article>)}</div>}
  <p className="fine">매시간 정규장(ET 09:30~16:00)에서, 16분 이상 지난 마지막 5분을 기준으로 계산해요(무료 전체 거래소 데이터 조건). 거래량은 과거 20거래일 같은 시각 5분 평균 대비, 체결강도는 그 5분 체결을 직전 가격 대비로 매수·매도로 나눈 추정치, VWAP는 당일 정규장 누적 기준이에요. 투자 권유가 아닌 관측 기록입니다.</p>
 </Card>;
}
