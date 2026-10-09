import React,{useEffect,useState} from 'react';
import {TrendingUp,TrendingDown,Minus,ChevronsUp,ChevronsDown,Activity,ChevronRight} from 'lucide-react';
import {pulseGroups,patterns,levelText} from '../server/market-pulse.js';
import InfoModal,{DriverTags,Section} from './info-modal.jsx';
import {Card} from './market-context.jsx';
const sessionName={pre:'장 시작 전',regular:'정규장',after:'장 마감 후',closed:'휴장',overnight:'데이장'};
const toneOf=id=>({risk_off:'down',slowdown:'down',inflation:'warn',risk_on:'up',growth:'up',easing:'up'}[id]||'flat');
const LevelIcon=({v})=>v===2?<ChevronsUp size={15}/>:v===1?<TrendingUp size={15}/>:v===-1?<TrendingDown size={15}/>:v===-2?<ChevronsDown size={15}/>:<Minus size={15}/>;
const kstTime=at=>new Date(at).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit'});
const kstDay=at=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date(at));
const symbolsOf=g=>g.items.map(([s,sign])=>sign<0?`${s}(반대 방향)`:s).join(' · ');
const groupPlain={stocks:'미국 대표 주가지수 ETF예요. 시장 전체의 기분을 보여줘요.',rates:'국채 ETF 가격의 반대 방향으로 금리를 봐요. 금리가 오르면 국채 가격은 내려가요.',fear:'변동성 ETF예요. 오르면 시장이 불안하다는 뜻이에요.',crypto:'비트코인·이더리움이에요. 24시간 거래되고, 시장에 돈이 넘치고 자신감이 클 때 가장 먼저 오르는 위험자산이에요.',
 oil:'원유 ETF예요. 기름값은 물가와 기업 비용에 바로 닿아요.',natgas:'천연가스 ETF예요. 전기요금·난방비·공장 연료비를 좌우하고, 날씨와 유럽 공급 문제에 크게 반응해요.',gold:'금 ETF예요. 불안하거나 돈의 가치가 떨어질까 걱정될 때 돈이 피하는 대표 안전자산이에요.',silver:'은 ETF예요. 귀금속이면서 태양광·전자제품에 쓰이는 산업 금속이라, 금과 다르게 움직이면 산업 수요 신호로 읽혀요.',copper:'구리 ETF예요. 전선·건설·전기차에 두루 쓰여 경기의 체온계로 불려요.',grains:'농산물 종합·옥수수·밀이에요. 먹거리 물가와 가뭄·전쟁 같은 공급 문제를 먼저 보여줘요.'};
export default function MarketPulse(){
 const [history,setHistory]=useState(null),[error,setError]=useState(''),[pick,setPick]=useState(null),[modal,setModal]=useState(null);
 useEffect(()=>{fetch('/data/pulse/history.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(Error(r.status===404?'아직 수집된 기록이 없습니다.':`HTTP ${r.status}`))).then(setHistory).catch(e=>setError(e.message))},[]);
 const items=history?.items||[],cur=pick?items.find(i=>i.at===pick):items.at(-1);
 const days=[...new Set(items.map(i=>kstDay(i.at)))].sort().reverse();
 const dayFlow=cur?items.filter(i=>kstDay(i.at)===kstDay(cur.at)):[];
 const group=modal?.group&&pulseGroups.find(g=>g.id===modal.group);
 return <Card icon={Activity} title="시장 분위기" sub="시장 지표와 원자재를 4시간마다 확인해 누적 · 한국 낮 시간은 데이장" meta={cur&&`${kstDay(cur.at).slice(5).replace('-','/')} ${kstTime(cur.at)} · ${sessionName[cur.session]}`}>
  {!cur?<p className="fine">{error||'불러오는 중'}</p>:<>
   <button type="button" className={`pulse-hero tone-${toneOf(cur.pattern.id)}`} onClick={()=>setModal({flow:true})} aria-haspopup="dialog"><span className="pulse-pattern">{cur.pattern.name}</span><p>{cur.summary}</p>{dayFlow.length>1&&<small>이날 흐름 · {dayFlow.map(i=>i.pattern.name).join(' → ')}</small>}<ChevronRight size={14} className="home-row-go"/></button>
   {[['market',null],['commodity','원자재']].map(([sec,label])=>{const gs=pulseGroups.filter(g=>g.section===sec);return <div key={sec} className="pulse-section">{label&&<h3 className="pulse-section-title">{label}</h3>}<div className="pulse-groups">{gs.map(g=>{const v=cur.groups[g.id];return <button type="button" key={g.id} onClick={()=>setModal({group:g.id})} aria-haspopup="dialog" className={`pulse-group lv${v??'na'} ${g.id==='fear'?'inverse':''} ${cur.lead.includes(g.id)?'is-lead':''}`}><span className="pulse-group-name">{g.name}</span><strong><LevelIcon v={v}/>{v==null?'미수집':levelText[v]}</strong></button>})}</div></div>})}
   <div className="pulse-history"><div className="pulse-rows">{days.slice(0,3).map(d=><div key={d} className="pulse-row"><span>{d.slice(5).replace('-','/')}</span><div>{items.filter(i=>kstDay(i.at)===d).map(i=><button key={i.at} type="button" className={`pulse-chip tone-${toneOf(i.pattern.id)} ${i.at===cur.at?'is-active':''}`} onClick={()=>setPick(i.at)} aria-pressed={i.at===cur.at}><small>{kstTime(i.at)}</small>{i.pattern.name}</button>)}</div></div>)}</div>{days.length>3&&<button type="button" className="home-link" onClick={()=>setModal({history:true})}>지난 기록 {days.length}일 모두 보기</button>}</div>
  </>}
  <InfoModal open={modal} onClose={()=>setModal(null)} title={modal?.flow?`${cur?.pattern.name} · ${kstTime(cur?.at)}`:group?group.name:'시장 분위기 기록'} badge={modal?.flow&&<span className="ctx-strength mid">{sessionName[cur.session]}</span>}>{modal?.flow&&cur&&<>
    <Section title="지금 분위기"><p>{cur.summary}</p>{cur.session==='overnight'&&<p className="pulse-caution">데이장(미국 주간거래) 시세예요. 거래량이 적어 몇 건의 주문에도 가격이 크게 움직일 수 있어요.</p>}</Section>
    <Section title="이날 흐름"><ul>{dayFlow.map(i=><li key={i.at}>{kstTime(i.at)} {sessionName[i.session]} · <b>{i.pattern.name}</b></li>)}</ul></Section>
    <Section title="패턴은 어떻게 판정하나요?"><p>각 지표의 움직임을 최근 60거래일의 평소 하루 변동폭과 비교해요. 여러 묶음이 함께 움직이는 모양이 아래 패턴과 맞으면 그 이름을 붙여요.</p><ul>{patterns.map(p=><li key={p.id}><b>{p.name}</b> · {Object.entries(p.when).map(([g,s])=>`${pulseGroups.find(x=>x.id===g).name}${s>0?'↑':'↓'}`).join(' ')}</li>)}</ul></Section></>}
   {group&&cur&&<>
    <Section title="지금"><p className="info-big"><LevelIcon v={cur.groups[group.id]}/> {cur.groups[group.id]==null?'미수집':levelText[cur.groups[group.id]]}</p></Section>
    <Section title="이게 뭐예요?"><p>{groupPlain[group.id]}</p><p className="fine">대리지표 · {symbolsOf(group)}</p></Section>
    <Section title="최근 기록"><div className="pulse-trail">{items.slice(-18).map(i=><span key={i.at} title={`${kstDay(i.at)} ${kstTime(i.at)}`} className={`pulse-group lv${i.groups[group.id]??'na'} ${group.id==='fear'?'inverse':''}`}><LevelIcon v={i.groups[group.id]}/></span>)}</div><p className="fine">왼쪽이 오래된 기록, 오른쪽이 최신이에요.</p></Section>
    <Section title="연결된 Driver"><DriverTags ids={group.drivers}/></Section></>}
   {modal?.history&&<div className="pulse-rows">{days.map(d=><div key={d} className="pulse-row"><span>{d.slice(5).replace('-','/')}</span><div>{items.filter(i=>kstDay(i.at)===d).map(i=><button key={i.at} type="button" className={`pulse-chip tone-${toneOf(i.pattern.id)}`} onClick={()=>{setPick(i.at);setModal(null)}}><small>{kstTime(i.at)}</small>{i.pattern.name}</button>)}</div></div>)}</div>}
  </InfoModal>
 </Card>;
}
