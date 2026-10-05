import React,{useMemo,useState} from 'react';
const sectorKo={'Information Technology':'정보기술',Financials:'금융',Energy:'에너지','Health Care':'헬스케어','Consumer Discretionary':'경기소비재','Consumer Staples':'필수소비재',Industrials:'산업재',Materials:'소재',Utilities:'유틸리티','Real Estate':'부동산','Communication Services':'커뮤니케이션'};
// Squarified treemap (Bruls et al.) over normalized weights.
function squarify(items,x,y,w,h){
 const out=[],total=items.reduce((s,i)=>s+i.weight,0);if(!total)return out;
 let rest=items.map(i=>({...i,area:i.weight/total*w*h})),rx=x,ry=y,rw=w,rh=h;
 const worst=(row,side)=>{const s=row.reduce((a,r)=>a+r.area,0),mx=Math.max(...row.map(r=>r.area)),mn=Math.min(...row.map(r=>r.area));return Math.max(side*side*mx/(s*s),s*s/(side*side*mn))};
 while(rest.length){
  const side=Math.min(rw,rh);let row=[rest[0]],i=1;
  while(i<rest.length&&worst([...row,rest[i]],side)<=worst(row,side)){row.push(rest[i]);i++}
  const s=row.reduce((a,r)=>a+r.area,0);
  if(rw>=rh){const cw=s/rh;let cy=ry;for(const r of row){const ch=r.area/cw;out.push({...r,x:rx,y:cy,w:cw,h:ch});cy+=ch}rx+=cw;rw-=cw}
  else{const ch=s/rw;let cx=rx;for(const r of row){const cw2=r.area/ch;out.push({...r,x:cx,y:ry,w:cw2,h:ch});cx+=cw2}ry+=ch;rh-=ch}
  rest=rest.slice(i);
 }
 return out;
}
const color=v=>{if(!Number.isFinite(v))return '#27272A';const t=Math.min(1,Math.abs(v)/3);const [r,g,b]=v>=0?[23,201,100]:[245,65,128];const base=[39,39,42];return `rgb(${base.map((c,i)=>Math.round(c+([r,g,b][i]-c)*(0.25+0.75*t))).join(',')})`};
const pct=v=>Number.isFinite(v)?`${v>0?'+':''}${v.toFixed(2)}%`:'—';
export default function SectorHeatmap({assets=[],metrics={}}){
 const [focus,setFocus]=useState(null);
 const W=1200,H=560;
 const tiles=useMemo(()=>{
  const groups={};for(const a of assets.filter(a=>a.kind==='stock'))(groups[a.sector]??=[]).push(a);
  const sectors=Object.entries(groups).map(([name,list])=>{const vals=list.map(a=>metrics[a.symbol]?.change).filter(Number.isFinite);return {name,list,weight:list.length,avg:vals.length?vals.reduce((s,v)=>s+v,0)/vals.length:null}}).sort((a,b)=>b.weight-a.weight);
  return squarify(sectors,0,0,W,H).map(s=>{const head=18,inner=squarify(s.list.map(a=>({...a,weight:1,change:metrics[a.symbol]?.change})).sort((a,b)=>Math.abs(b.change??0)-Math.abs(a.change??0)),s.x+1,s.y+head,Math.max(0,s.w-2),Math.max(0,s.h-head-1));return {...s,inner}});
 },[assets,metrics]);
 const has=Object.keys(metrics).length>0;
 return <section className="sector-heatmap" aria-label="섹터 히트맵"><div className="heatmap-head"><h2>섹터 히트맵</h2><span>S&P 500 · 섹터 면적은 구성 종목 수 · 색은 당일 등락률{has?'':' (시세 조회 후 표시)'}</span><span className="heatmap-scale"><i style={{background:color(-3)}}/>-3%<i style={{background:color(0)}}/>0<i style={{background:color(3)}}/>+3%</span></div>
 <div className="heatmap-canvas" style={{aspectRatio:`${W}/${H}`}}>{tiles.map(s=><div key={s.name} className="heatmap-sector" style={{left:`${s.x/W*100}%`,top:`${s.y/H*100}%`,width:`${s.w/W*100}%`,height:`${s.h/H*100}%`}}><span className="heatmap-sector-name">{sectorKo[s.name]||s.name} <b className={s.avg>0?'positive':s.avg<0?'negative':''}>{pct(s.avg)}</b></span>{s.inner.map(t=>{const big=t.w>30&&t.h>22,tall=t.h>34;return <button type="button" key={t.symbol} className="heatmap-tile" title={`${t.symbol} · ${t.name} · ${pct(t.change)}`} onMouseEnter={()=>setFocus(t)} onFocus={()=>setFocus(t)} style={{left:`${(t.x-s.x)/s.w*100}%`,top:`${(t.y-s.y)/s.h*100}%`,width:`${t.w/s.w*100}%`,height:`${t.h/s.h*100}%`,background:color(t.change)}}>{big&&<><strong>{t.symbol}</strong>{tall&&<small>{pct(t.change)}</small>}</>}</button>})}</div>)}</div>
 <p className="fine">{focus?`${focus.symbol} · ${focus.name} · ${sectorKo[focus.sector]||focus.sector}${focus.industry?` · ${focus.industry}`:''} · ${pct(focus.change)}`:'타일에 마우스를 올리면 종목 정보가 표시됩니다. 시가총액 데이터가 없어 종목 면적은 동일합니다.'}</p></section>;
}
