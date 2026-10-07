import React,{useEffect,useState} from 'react';
import {Compass,Route,Gauge,Globe2,ChevronRight,TrendingUp,TrendingDown,Minus} from 'lucide-react';
import InfoModal,{DriverTags,Section} from './info-modal.jsx';
import WorldMap from './world-map.jsx';
const fmt=(v,u)=>v==null?'—':`${v}${['%','%p','원','엔','위안'].includes(u)?u:''}`;
const tone=p=>p==null?'na':p>=90?'vhigh':p>=70?'high':p>30?'mid':p>10?'low':'vlow';
const rel=p=>p>=100?'가장 높은':p>=50?`상위 ${Math.max(1,100-p)}%`:`하위 ${Math.max(1,p)}%`;
export function useContextData(){
 const [state,setState]=useState({data:null,error:''});
 useEffect(()=>{fetch('/data/context.json',{cache:'no-cache'}).then(r=>r.ok?r.json():Promise.reject(Error(r.status===404?'아직 수집된 기록이 없습니다.':`HTTP ${r.status}`))).then(data=>setState({data,error:''})).catch(e=>setState({data:null,error:e.message}))},[]);
 return state;
}
// Range bar: position of now within the window; era averages as ticks.
function RangeBar({item,compact}){
 const pos=v=>item.max>item.min?Math.min(100,Math.max(0,(v-item.min)/(item.max-item.min)*100)):50;
 const now=item.value!=null?pos(item.value):item.percentile;
 const ticks=compact?[]:(item.eras||[]).map(e=>({label:e.label,at:item.value!=null?pos(e.avg):e.percentile})).filter(t=>Number.isFinite(t.at));
 return <span className={`ctx-bar ${compact?'compact':''}`} role="img" aria-label={`${item.name} 범위 중 현재 위치 ${item.percentile}백분위`}><span className="ctx-track"/>{ticks.map(t=><span key={t.label} className="ctx-tick" style={{left:`${t.at}%`}} title={`${t.label} 평균`}/>)}<span className={`ctx-dot ${tone(item.percentile)}`} style={{left:`${now}%`}}/>{!compact&&<span className="ctx-ends"><span>{item.value!=null?`최저 ${fmt(item.min,item.unit)}`:'낮음'}</span><span>{item.value!=null?`최고 ${fmt(item.max,item.unit)}`:'높음'}</span></span>}</span>;
}
export function Card({icon:Icon,title,sub,meta,children,className=''}){return <section className={`home-card ${className}`}><header className="home-card-head"><div><h2><Icon size={17}/>{title}</h2>{sub&&<p>{sub}</p>}</div>{meta&&<span className="home-meta">{meta}</span>}</header>{children}</section>}
function Status({data,error}){return !data&&<p className="fine">{error||'불러오는 중'}</p>}
// One compact row; pressing opens the modal.
export function Row({onPress,name,right,below}){return <button type="button" className="home-row" onClick={onPress} aria-haspopup="dialog"><span className="home-row-main"><span className="home-row-name">{name}</span>{right}</span>{below}<ChevronRight size={14} className="home-row-go"/></button>}
function IndicatorModal({item,onClose}){
 return <InfoModal open={item} onClose={onClose} title={item?.name} badge={item&&<span className={`ctx-pos ${tone(item.percentile)}`}>{item.position}</span>}>{item&&<>
  {item.value!=null&&<p className="info-big">{fmt(item.value,item.unit)}</p>}
  <Section><RangeBar item={item}/><p className="info-legend"><i className="ctx-dot-key"/>지금 <i className="ctx-tick-key"/>2000~2007년 · 저금리 시대(2009~2021년) 평균</p></Section>
  <Section title="과거와 비교하면"><p>{item.compare}</p>{item.eras?.length>0&&<ul>{item.eras.map(e=><li key={e.id}>{e.label} 평균 · {item.value!=null?fmt(e.avg,item.unit):`이 기간 중 ${rel(e.percentile)} 수준`}</li>)}</ul>}</Section>
  <Section title="이게 뭐예요?"><p>{item.plain}</p></Section>
  <Section title="연결된 Driver"><DriverTags ids={item.drivers}/></Section>
  <p className="fine">{item.windowFrom.slice(0,4)}년~{item.asOf} 기준 · {item.percentile}백분위(100에 가까울수록 이 기간 중 높음)</p>
 </>}</InfoModal>;
}
function IndicatorRows({items,onPick}){return <div className="home-rows">{items.map(it=><Row key={it.id} onPress={()=>onPick(it)} name={it.name} right={<span className="home-row-right"><span className={`ctx-pos ${tone(it.percentile)}`}>{it.position}</span>{it.value!=null&&<b>{fmt(it.value,it.unit)}</b>}</span>} below={<RangeBar item={it} compact/>}/>)}</div>}

export function ContextCard({data,error}){
 const [pick,setPick]=useState(null);const items=(data?.items||[]).filter(i=>i.group==='level');
 return <Card icon={Compass} title="지금 시장은 어디쯤?" sub="지금 수준이 과거 20년(주가는 150년)과 비교해 높은지 낮은지" meta={data&&`${new Date(data.generatedAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})} 갱신`}>
  <Status data={data} error={error}/>{data&&<><div className="home-summary">{data.summary.map((l,i)=><p key={i}>{l}</p>)}</div><IndicatorRows items={items} onPick={setPick}/>
  <Scenarios data={data}/>
  {data.cape&&<p className="fine">참고 · CAPE(이익 대비 주가)는 공개 데이터가 {data.cape.asOf.slice(0,7)}에 멈춰 있어요. 그때 1871년 이후 상위 {Math.max(1,100-data.cape.percentile)}% 수준이었어요.</p>}</>}
  <IndicatorModal item={pick} onClose={()=>setPick(null)}/></Card>;
}
function Scenarios({data}){
 const [pick,setPick]=useState(null);
 return <div className="home-subsection"><h3><Route size={15}/>이런 시장에서 사람들의 움직임</h3><p className="home-subnote">지금 위치가 가장 강하게 뒷받침하는 순서</p>{data&&<div className="home-rows">{(data.scenarios||[]).map(sc=><Row key={sc.id} onPress={()=>setPick(sc)} name={<><span className={`sc-rank r${sc.rank}`}>{sc.rank}</span>{sc.title}</>} right={<span className={`ctx-strength ${sc.strength==='강함'?'strong':sc.strength==='보통'?'mid':'weak'}`}>{sc.strength}</span>} below={<span className="ctx-meter"><i style={{width:`${sc.score}%`}}/></span>}/>)}</div>}
  <p className="fine">흔히 나타나는 움직임을 설명한 것이며 매수·매도 추천이 아닙니다.</p>
  <InfoModal open={pick} onClose={()=>setPick(null)} title={pick&&`${pick.rank}. ${pick.title}`} badge={pick&&<span className="ctx-strength strong">근거 강도 {pick.score}/100</span>}>{pick&&<>
   <Section title="사람들의 움직임"><p>{pick.act}</p></Section>
   <Section title="근거"><ul>{pick.basis.map(b=><li key={b}>{b}</li>)}</ul></Section>
   <Section title="확인할 신호"><p>{pick.watch}</p></Section>
   <Section title="달라지는 경우"><p>{pick.against}</p></Section>
   <Section title="연결된 Driver"><DriverTags ids={pick.drivers}/></Section></>}</InfoModal>
 </div>;
}
const TrendIcon=({t})=>t==='up'?<TrendingUp size={15}/>:t==='down'?<TrendingDown size={15}/>:<Minus size={15}/>;
export function DirectionCard({data,error}){
 const [pick,setPick]=useState(null);const d=data?.direction;
 return <Card icon={Gauge} title="경기 방향" sub="최근 평균을 그 전과 비교해 좋아지는지 나빠지는지">
  <Status data={data} error={error}/>{d&&<><div className="home-summary"><p>{d.summary}</p></div><div className="home-rows">{d.items.map(it=><Row key={it.id} onPress={()=>setPick(it)} name={it.name} right={<span className={`trend trend-${it.trend}`}><TrendIcon t={it.trend}/>{it.trendText}</span>}/>)}</div></>}
  <InfoModal open={pick} onClose={()=>setPick(null)} title={pick?.name} badge={pick&&<span className={`trend trend-${pick.trend}`}><TrendIcon t={pick.trend}/>{pick.trendText}</span>}>{pick&&<>
   <Section title="최근 변화"><p>{pick.detail}</p></Section>
   <Section title="이게 뭐예요?"><p>{pick.plain}</p></Section>
   <Section title="연결된 Driver"><DriverTags ids={pick.drivers}/></Section>
   <p className="fine">{pick.asOf} 발표분까지 반영 · 발표 값의 방향만 보며 예상치와 비교하지 않습니다.</p></>}</InfoModal>
 </Card>;
}
export function GlobalCard({data,error}){
 const [pick,setPick]=useState(null);const items=(data?.items||[]).filter(i=>i.group==='global'||['rate10','dollar'].includes(i.id));
 return <Card icon={Globe2} title="세계 속 미국 시장" sub="내 수익에 닿는 환율과 주요국 금리 · 나라에 마우스를 올리면 자세히 보여요" className="home-wide">
  <Status data={data} error={error}/>{data?.global&&<><div className="home-summary">{data.global.summary.map((l,i)=><p key={i}>{l}</p>)}</div><WorldMap items={items} onPick={setPick}/></>}
  <InfoModal open={pick} onClose={()=>setPick(null)} title={pick?.name}>{pick&&pick.data.map(d=><Section key={d.id} title={d.name}><p className="info-big">{fmt(d.value,d.unit)} <span className={`ctx-pos ${tone(d.percentile)}`}>{d.position}</span></p><RangeBar item={d}/><p className="world-compare">{d.compare}</p><p className="fine">{d.plain}</p><DriverTags ids={d.drivers}/></Section>)}</InfoModal></Card>;
}
