// FRED macro series → private-market/macro.json (sealed into market.enc by collect_market; some series are not redistributable).
import fs from 'node:fs/promises';
import {macroSeries,fredTime} from '../server/macro-series.js';
const key=process.env.FRED_API_KEY;
if(!key){console.error('FRED_API_KEY 미등록');process.exit(1)}
const start=new Date(Date.now()-3*365*864e5).toISOString().slice(0,10);
async function get(path,params){
 const url=new URL(`https://api.stlouisfed.org/fred/${path}`);url.search=new URLSearchParams({...params,api_key:key,file_type:'json'}).toString();
 for(let attempt=0;attempt<3;attempt++){
  try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(r.ok)return r.json();if(r.status!==429&&r.status<500)throw Error(`HTTP ${r.status}`)}catch(e){if(attempt===2)throw Error(e.message.replace(key,'***'))}
  await new Promise(res=>setTimeout(res,2000*(attempt+1)));
 }
 throw Error('재시도 초과');
}
const series={},errors=[];
for(const s of macroSeries){
 try{
  const [info,obs]=await Promise.all([get('series',{series_id:s.id}),get('series/observations',{series_id:s.id,observation_start:start})]);
  const meta=info.seriess?.[0];
  series[s.id]={title:meta?.title||s.id,frequency:meta?.frequency_short||null,units:meta?.units_short||null,lastUpdated:fredTime(meta?.last_updated),observations:(obs.observations||[]).filter(o=>o.value!=='.').map(o=>({d:o.date,v:Number(o.value)})).filter(o=>Number.isFinite(o.v))};
 }catch(e){errors.push(`${s.id}: ${e.message}`)}
 await new Promise(res=>setTimeout(res,600));
}
await fs.mkdir('private-market',{recursive:true});
await fs.writeFile('private-market/macro.json',JSON.stringify({source:'FRED, Federal Reserve Bank of St. Louis',collectedAt:new Date().toISOString(),series,errors}));
console.log(`FRED ${Object.keys(series).length}/${macroSeries.length} series${errors.length?` · errors: ${errors.join('; ')}`:''}`);
if(errors.length===macroSeries.length)process.exit(1);
