import React,{useEffect,useMemo,useState} from 'react';
import {geoNaturalEarth1,geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import {levelHint} from './etf-hints.js';
import {EtfList} from './etf-ticker.jsx';
const W=960,H=330;
const tone=p=>p==null?'na':p>=90?'vhigh':p>=70?'high':p>30?'mid':p>10?'low':'vlow';
const fmt=(v,u)=>v==null?'—':`${v}${['%','%p','원','엔','위안'].includes(u)?u:''}`;
// Countries on the map: ISO numeric id, where the marker sits, where its label box sits (lon/lat), and indicators.
export const regions=[
 {id:'us',iso:['840'],name:'미국',at:[-98,39],label:[-118,12],items:['rate10','dollar']},
 {id:'eu',iso:['276'],name:'독일 · 유로',at:[10.4,51],label:[-2,24],items:['eur','de10']},
 {id:'cn',iso:['156'],name:'중국',at:[104,35],label:[86,16],items:['cny']},
 {id:'kr',iso:['410'],name:'한국',at:[127.8,36.5],label:[112,58],items:['krw']},
 {id:'jp',iso:['392'],name:'일본',at:[138.5,37],label:[146,8],items:['jpy','jp10','usjp']},
];
// Unique ETFs hinted by a country's indicators in their current state.
const etfsOf=r=>{const seen=new Map();for(const d of r.data)for(const e of levelHint(d)?.etfs||[])if(!seen.has(e[0]))seen.set(e[0],e);return [...seen.values()].slice(0,3)};
export default function WorldMap({items,onPick}){
 const [geo,setGeo]=useState(null),[hover,setHover]=useState('');
 // The map geometry loads lazily so the home bundle stays small.
 useEffect(()=>{let live=true;import('world-atlas/countries-110m.json').then(m=>{if(live)setGeo(feature(m.default,m.default.objects.countries).features.filter(f=>f.id!=='010'))});return()=>{live=false}},[]);
 // Crop to 50°S–72°N: inhabited land only, much shorter than the full globe.
 const projection=useMemo(()=>geo&&geoNaturalEarth1().fitExtent([[0,0],[W,H]],{type:'MultiPoint',coordinates:[[-169,72],[179,72],[-169,-50],[179,-50],[0,72],[0,-50]]}),[geo]);
 const path=useMemo(()=>projection&&geoPath(projection),[projection]);
 const by=Object.fromEntries((items||[]).map(i=>[i.id,i]));
 const list=regions.map(r=>({...r,data:r.items.map(id=>by[id]).filter(Boolean)})).filter(r=>r.data.length);
 const isoTone=Object.fromEntries(list.flatMap(r=>r.iso.map(i=>[i,tone(r.data[0].percentile)])));
 const pct=([x,y])=>({left:`${x/W*100}%`,top:`${y/H*100}%`});
 return <div className="world">
  <div className="world-canvas">
   <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="주요국 환율·금리 위치 지도">
    {path&&geo.map(f=><path key={f.id||f.properties.name} d={path(f)} className={`world-land ${isoTone[f.id]?`hl ${isoTone[f.id]}`:''}`}/>)}
    {projection&&list.map(r=>{const a=projection(r.at),b=projection(r.label);return <g key={r.id} className={hover===r.id?'is-hover':''}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="world-leader"/><circle cx={a[0]} cy={a[1]} r="4" className={`world-pin ${tone(r.data[0].percentile)}`}/></g>})}
   </svg>
   {projection&&list.map(r=>{const b=projection(r.label);return <button type="button" key={r.id} className={`world-label t-${tone(r.data[0].percentile)} ${b[0]>W*0.62?'edge-right':b[0]<W*0.3?'edge-left':''} ${b[1]>H*0.5?'edge-low':''}`} style={pct(b)} onMouseEnter={()=>setHover(r.id)} onMouseLeave={()=>setHover('')} onFocus={()=>setHover(r.id)} onBlur={()=>setHover('')} onClick={()=>onPick(r)} aria-haspopup="dialog">
    <strong>{r.name}</strong>
    {r.data.slice(0,2).map(d=><span key={d.id} className="world-line"><span>{d.name.replace(/\(.*\)/,'')}</span><b>{fmt(d.value,d.unit)}</b><em className={`ctx-pos ${tone(d.percentile)}`}>{d.position}</em></span>)}
    {etfsOf(r).length>0&&<span className="world-etf">몰릴만한 ETF · <EtfList etfs={etfsOf(r)}/></span>}
    {hover===r.id&&<span className="world-tip" role="tooltip">{r.data.map(d=><span key={d.id}><b>{d.name} · {fmt(d.value,d.unit)}</b><span>{d.compare}</span><small>{d.plain}</small></span>)}<small className="world-tip-more">눌러서 자세히 보기</small></span>}
   </button>})}
   {!geo&&<p className="fine world-loading">지도를 불러오는 중</p>}
  </div>
  {/* Narrow screens: the same content as a list under the map. */}
  <div className="world-list">{list.map(r=><button type="button" key={r.id} className="home-row" onClick={()=>onPick(r)}><span className="home-row-main"><span className="home-row-name"><strong>{r.name}</strong></span></span>{r.data.slice(0,2).map(d=><span key={d.id} className="world-line"><span>{d.name}</span><b>{fmt(d.value,d.unit)}</b><em className={`ctx-pos ${tone(d.percentile)}`}>{d.position}</em></span>)}{etfsOf(r).length>0&&<span className="world-etf">몰릴만한 ETF · <EtfList etfs={etfsOf(r)}/></span>}</button>)}</div>
 </div>;
}
