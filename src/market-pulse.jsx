import React,{useEffect,useState} from 'react';
import {TrendingUp,TrendingDown,Minus,ChevronsUp,ChevronsDown,Activity} from 'lucide-react';
import {pulseGroups,patterns,levelText} from '../server/market-pulse.js';
import {DriverIcon} from './driver-icons.jsx';
import {drivers} from './framework.js';
const driverName=id=>drivers.find(d=>d.id===id)?.name||id;
const sessionName={pre:'장 시작 전',regular:'정규장',after:'장 마감 후',closed:'휴장',overnight:'데이장'};
const toneOf=id=>({risk_off:'down',slowdown:'down',inflation:'warn',risk_on:'up',growth:'up',easing:'up'}[id]||'flat');
const LevelIcon=({v})=>v===2?<ChevronsUp size={16}/>:v===1?<TrendingUp size={16}/>:v===-1?<TrendingDown size={16}/>:v===-2?<ChevronsDown size={16}/>:<Minus size={16}/>;
const kstTime=at=>new Date(at).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit'});
const kstDay=at=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date(at));
export default function MarketPulse(){
 const [history,setHistory]=useState(null),[error,setError]=useState(''),[pick,setPick]=useState(null);
 useEffect(()=>{fetch('/data/pulse/history.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(Error(r.status===404?'아직 수집된 기록이 없습니다.':`HTTP ${r.status}`))).then(setHistory).catch(e=>setError(e.message))},[]);
 const items=history?.items||[],cur=pick?items.find(i=>i.at===pick):items.at(-1);
 // Group the accumulated pulses by Korean calendar day, newest first, last 7 days.
 const days=[...new Set(items.map(i=>kstDay(i.at)))].sort().reverse().slice(0,7);
 const todayFlow=cur?items.filter(i=>kstDay(i.at)===kstDay(cur.at)):[];
 return <section className="pulse-card" aria-labelledby="pulse-title"><div className="cal-section-heading"><div><h2 id="pulse-title"><Activity size={18}/> 시장 분위기</h2><p>주가·금리·유가·원자재·안전자산·위험자산·공포지수를 4시간마다 확인해 누적합니다. 한국 낮 시간은 데이장 시세로 봅니다.</p></div>{cur&&<span className="pulse-time">{kstDay(cur.at).slice(5).replace('-','/')} {kstTime(cur.at)} KST · {sessionName[cur.session]}</span>}</div>
  {!cur?<p className="fine">{error||'불러오는 중'}</p>:<>
   <div className={`pulse-hero tone-${toneOf(cur.pattern.id)}`}><span className="pulse-pattern">{cur.pattern.name}</span><p>{cur.summary}</p>{cur.session==='overnight'&&<small className="pulse-caution">데이장(미국 주간거래) 시세 · 거래량이 적어 몇 건의 주문에도 가격이 크게 움직일 수 있어요. 직전 정규장 종가와 비교했어요.</small>}{todayFlow.length>1&&<small>이날 흐름 · {todayFlow.map(i=>`${kstTime(i.at)} ${i.pattern.name}`).join(' → ')}</small>}</div>
   <div className="pulse-groups">{pulseGroups.map(g=>{const v=cur.groups[g.id];return <div key={g.id} className={`pulse-group lv${v??'na'} ${g.id==='fear'?'inverse':''} ${cur.lead.includes(g.id)?'is-lead':''}`}><span className="pulse-group-name">{g.name}</span><strong><LevelIcon v={v}/>{v==null?'미수집':levelText[v]}</strong><span className="pulse-drivers">{g.drivers.map(d=><span key={d} title={driverName(d)}><DriverIcon id={d} size={11}/>{driverName(d)}</span>)}</span></div>})}</div>
   <div className="pulse-history"><h3>누적 기록</h3><div className="pulse-rows">{days.map(d=><div key={d} className="pulse-row"><span>{d.slice(5).replace('-','/')}</span><div>{items.filter(i=>kstDay(i.at)===d).map(i=><button key={i.at} type="button" className={`pulse-chip tone-${toneOf(i.pattern.id)} ${i.at===cur.at?'is-active':''}`} onClick={()=>setPick(i.at)} aria-pressed={i.at===cur.at}><small>{kstTime(i.at)}</small>{i.session==='overnight'?<em>데이장</em>:null}{i.pattern.name}</button>)}</div></div>)}</div></div>
   <details className="pulse-legend"><summary>패턴은 어떻게 판정하나요?</summary><p>각 지표의 오늘 움직임을 최근 60거래일의 평소 하루 변동폭과 비교합니다. 여러 묶음이 함께 움직이는 모양이 아래 패턴과 맞으면 그 이름을 붙입니다.</p><ul>{patterns.map(p=><li key={p.id}><b>{p.name}</b> · {Object.entries(p.when).map(([g,s])=>`${pulseGroups.find(x=>x.id===g).name}${s>0?'↑':'↓'}`).join(' ')}</li>)}</ul><p className="fine">ETF 시세 기반 대리지표입니다(국채 금리는 국채 ETF 반대 방향, 공포지수는 VIXY). 가격 수치는 공개하지 않고 방향과 강도만 보여줍니다. 투자 권유가 아닙니다.</p></details>
  </>}</section>;
}
