// Sector layer for the funnel: daily closes (relative strength vs SPY) and the last hour's flow for the
// 11 sector ETFs, combined with macro rules from the long-run context.
import fs from 'node:fs/promises';
import {sectors,macroSectorScores,regimeLine,relStrength,rsStage,sectorVerdict} from '../../server/sector-flow.js';
import {symbolFlow,volStage} from '../../server/fund-flow.js';
import {drivers} from '../../src/framework.js';
const read=async p=>{try{return JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'))}catch{return null}};
export async function sectorLayer({headers,at=new Date()}){
 const get=async u=>{const r=await fetch(u,{headers,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`${u.pathname} HTTP ${r.status}`);return r.json()};
 const syms=[...sectors.map(s=>s.etf),'SPY'],end=new Date(at-16*6e4);
 const pull=async(timeframe,days)=>{const u=new URL('https://data.alpaca.markets/v2/stocks/bars');u.search=new URLSearchParams({symbols:syms.join(','),timeframe,start:new Date(at-days*864e5).toISOString(),end:end.toISOString(),feed:'sip',limit:'10000'});const out={};let t;
  do{if(t)u.searchParams.set('page_token',t);const d=await get(u);for(const [s,b] of Object.entries(d.bars||{}))(out[s]||=[]).push(...b);t=d.next_page_token}while(t);return out};
 const [daily,hourly]=await Promise.all([pull('1Day',50),pull('1Hour',35)]);
 const context=await read('../../public/data/context.json');const macro=macroSectorScores(context);
 const close=s=>(daily[s]||[]).map(b=>b.c),spy=close('SPY');
 const list=sectors.map(s=>{
  const h=(hourly[s.etf]||[]).filter(b=>Date.parse(b.t)+3600e3<=end.getTime());
  const fresh=h.length&&end-Date.parse(h.at(-1).t)<=3*3600e3;const f=fresh?symbolFlow(h.map(b=>({t:b.t,o:b.o,c:b.c,v:b.v}))):null;
  const flow=f?{dir:f.ratio>=0.9&&f.z>=0.5?'in':f.ratio>=0.9&&f.z<=-0.5?'out':'flat',vol:volStage(f.ratio)}:null;
  const rs1w=relStrength(close(s.etf),spy,5),rs1m=relStrength(close(s.etf),spy,21);
  const v=sectorVerdict({macro:macro[s.id],rs1w,rs1m,flow});
  return {id:s.id,name:s.name,etf:s.etf,macro:{score:macro[s.id].score,plus:macro[s.id].plus.slice(0,3),minus:macro[s.id].minus.slice(0,3)},rs1w:rsStage(rs1w),rs1m:rsStage(rs1m),flow,...v};
 }).sort((a,b)=>b.total-a.total);
 return {regime:regimeLine(context),sectors:list,contextAt:context?.generatedAt||null};
}
// Latest daily-report candidates with their Driver names, for picks outside the regular session.
export async function reportCandidates(){
 const idx=await read('../../public/data/reports/index.json');const key=idx?.items?.[0];if(!key)return {candidates:[],report:null};
 const r=await read(`../../public/data/reports/${key.date}-${key.session}.json`);const name=id=>drivers.find(d=>d.id===id)?.name||id;
 return {report:{date:key.date,session:key.session},candidates:(r?.candidates||[]).map(c=>({symbol:c.symbol,name:c.name,sector:c.sector,drivers:[...new Set(c.paths.map(p=>name(p.driverId)))]}))};
}
