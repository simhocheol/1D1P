import React,{useEffect,useState} from 'react';
import {Compass} from 'lucide-react';
import {DriverIcon} from './driver-icons.jsx';
import {drivers} from './framework.js';
const driverName=id=>drivers.find(d=>d.id===id)?.name||id;
const fmt=(v,u)=>v==null?'—':`${v}${u==='%'||u==='%p'?u:''}`;
const tone=p=>p==null?'na':p>=90?'vhigh':p>=70?'high':p>30?'mid':p>10?'low':'vlow';
// Range bar: position of now within the window; era averages as ticks when values are public.
function RangeBar({item}){
 const pos=v=>item.max>item.min?Math.min(100,Math.max(0,(v-item.min)/(item.max-item.min)*100)):50;
 const now=item.value!=null?pos(item.value):item.percentile;
 const ticks=(item.eras||[]).map(e=>({label:e.label,at:item.value!=null?pos(e.avg):e.percentile})).filter(t=>Number.isFinite(t.at));
 return <div className="ctx-bar" role="img" aria-label={`${item.name} 범위 중 현재 위치 ${item.percentile}백분위`}><div className="ctx-track"/>{ticks.map(t=><span key={t.label} className="ctx-tick" style={{left:`${t.at}%`}} title={`${t.label} 평균`}/>)}<span className={`ctx-dot ${tone(item.percentile)}`} style={{left:`${now}%`}}/><div className="ctx-ends"><span>{item.value!=null?`최저 ${fmt(item.min,item.unit)}`:'낮음'}</span><span>{item.value!=null?`최고 ${fmt(item.max,item.unit)}`:'높음'}</span></div></div>;
}
export default function MarketContext(){
 const [data,setData]=useState(null),[error,setError]=useState(''),[open,setOpen]=useState('');
 useEffect(()=>{fetch('/data/context.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(Error(r.status===404?'아직 수집된 기록이 없습니다.':`HTTP ${r.status}`))).then(setData).catch(e=>setError(e.message))},[]);
 return <section className="ctx-card" aria-labelledby="ctx-title"><div className="cal-section-heading"><div><h2 id="ctx-title"><Compass size={18}/> 지금 시장은 어디쯤?</h2><p>오늘의 움직임이 아니라, 지금 수준이 과거와 비교해 높은지 낮은지를 봅니다. 하루 한 번 갱신합니다.</p></div>{data&&<span className="pulse-time">{new Date(data.generatedAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})} 갱신</span>}</div>
  {!data?<p className="fine">{error||'불러오는 중'}</p>:<>
   <div className="ctx-summary">{data.summary.map((l,i)=><p key={i}>{l}</p>)}</div>
   <div className="ctx-legend"><span><i className="ctx-dot-key"/>지금</span><span><i className="ctx-tick-key"/>과거 시기 평균(2000~2007년 · 저금리 시대 2009~2021년)</span></div>
   <div className="ctx-list">{data.items.map(it=><button type="button" key={it.id} className={`ctx-item ${open===it.id?'is-open':''}`} aria-expanded={open===it.id} onClick={()=>setOpen(open===it.id?'':it.id)}>
    <span className="ctx-head"><strong>{it.name}</strong><span className={`ctx-pos ${tone(it.percentile)}`}>{it.position}</span>{it.value!=null&&<b className="ctx-value">{fmt(it.value,it.unit)}</b>}</span>
    <RangeBar item={it}/>
    <span className="ctx-compare">{it.compare}</span>
    {open===it.id&&<span className="ctx-more"><span>{it.plain}</span>{it.eras?.length>0&&<span>{it.eras.map(e=>`${e.label} ${it.value!=null?fmt(e.avg,it.unit):(e.percentile>=50?`상위 ${Math.max(1,100-e.percentile)}% 수준`:`하위 ${Math.max(1,e.percentile)}% 수준`)}`).join(' · ')}</span>}<span className="ctx-drivers">{it.drivers.map(d=><span key={d}><DriverIcon id={d} size={11}/>{driverName(d)}</span>)}</span><small>{it.windowFrom.slice(0,4)}년~{it.asOf} 기준 · {it.percentile}백분위(100에 가까울수록 이 기간 중 높음)</small></span>}
   </button>)}</div>
   {data.cape&&<p className="fine">참고 · 주가 수준 지표(CAPE)는 공개 데이터가 {data.cape.asOf.slice(0,7)} 이후 갱신되지 않았습니다. 그 시점에 1871년 이후 상위 {Math.max(1,100-data.cape.percentile)}% 수준이었습니다.</p>}
   <p className="fine">출처 · {data.sources}. {data.notice} 투자 권유가 아닙니다.</p>
  </>}</section>;
}
