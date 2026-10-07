// Daily long-run context → public/data/context.json.
// Public-domain series publish values; restricted ones (VIX, S&P price) publish positions only.
import fs from 'node:fs/promises';
import {parse} from 'csv-parse/sync';
import {contextIndicators,describe,overall,scenarios} from '../server/market-context.js';
const key=process.env.FRED_API_KEY;
if(!key){console.error('FRED_API_KEY 미등록');process.exit(1)}
async function fred(id){
 const url=new URL('https://api.stlouisfed.org/fred/series/observations');url.search=new URLSearchParams({series_id:id,observation_start:'1995-01-01',api_key:key,file_type:'json'}).toString();
 for(let i=0;i<3;i++){try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(r.ok){const d=await r.json();return d.observations.filter(o=>o.value!=='.').map(o=>({d:o.date,v:Number(o.value)})).filter(o=>Number.isFinite(o.v))}if(r.status<500&&r.status!==429)throw Error(`HTTP ${r.status}`)}catch(e){if(i===2)throw Error(e.message.replaceAll(key,'***'))}await new Promise(s=>setTimeout(s,2000*(i+1)))}
}
// Shiller monthly data: real price (deflated by CPI) for the 150-year position; CAPE kept as a dated reference.
async function shiller(cpi){
 const r=await fetch('https://raw.githubusercontent.com/datasets/s-and-p-500/main/data/data.csv',{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`HTTP ${r.status}`);
 const rows=parse(await r.text(),{columns:true}).map(x=>({d:x.Date,p:+x.SP500,cpi:+x['Consumer Price Index'],cape:+x.PE10}));
 const fredCpi=new Map(cpi.map(o=>[o.d.slice(0,7),o.v]));const lastCpi=cpi.at(-1)?.v;
 // Fill missing CPI in recent rows from FRED (same CPI-U basis), else carry the last known value.
 let carry=null;const real=rows.map(x=>{const c=x.cpi>0?x.cpi:fredCpi.get(x.d.slice(0,7))||carry||lastCpi;carry=c;return x.p>0&&c>0?{d:x.d,v:x.p/c}:null}).filter(Boolean);
 const cape=rows.filter(x=>x.cape>0).at(-1);return {real,cape:cape?{value:cape.cape,asOf:cape.d,percentile:Math.round(rows.filter(x=>x.cape>0&&x.cape<=cape.cape).length/rows.filter(x=>x.cape>0).length*100)}:null};
}
const items=[],errors=[];let cpi=[],cape=null;
for(const ind of contextIndicators.filter(i=>i.fred)){
 try{const obs=await fred(ind.fred);if(ind.fred==='CPIAUCSL')cpi=obs;items.push(describe(ind,obs))}catch(e){errors.push(`${ind.id}: ${e.message}`)}
 await new Promise(s=>setTimeout(s,600));
}
try{const s=await shiller(cpi);cape=s.cape;items.push(describe(contextIndicators.find(i=>i.id==='stocks'),s.real,{windowYears:150}))}catch(e){errors.push(`stocks: ${e.message}`)}
const list=items.filter(Boolean);
const order=contextIndicators.map(i=>i.id);list.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
await fs.writeFile('public/data/context.json',JSON.stringify({version:1,generatedAt:new Date().toISOString(),summary:overall(list),scenarios:scenarios(list),items:list,cape,
 sources:'FRED(세인트루이스 연방준비은행) · Robert Shiller 주가 데이터(datasets/s-and-p-500)',notice:'VIX와 주가는 이용 조건에 따라 수치 없이 역사 속 위치만 표시합니다.',errors})+'\n');
console.log(`Context ${list.length}/${contextIndicators.length}${errors.length?` · errors: ${errors.join('; ')}`:''}`);
if(!list.length)process.exit(1);
