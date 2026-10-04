// Finnhub earnings calendar → public/data/earnings.json (S&P 500 constituents only).
import fs from 'node:fs/promises';
const output=new URL('../public/data/earnings.json',import.meta.url);
const universeFile=new URL('../public/data/universe.json',import.meta.url);
const token=process.env.FINNHUB_API_KEY;
const collectedAt=new Date().toISOString();
const et=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const [y,m]=et.split('-').map(Number);
const from=`${y}-${String(m).padStart(2,'0')}-01`,to=new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);
let previous;try{previous=JSON.parse(await fs.readFile(output,'utf8'))}catch{}
async function save(data){const tmp=new URL('../public/data/earnings.json.tmp',import.meta.url);await fs.writeFile(tmp,JSON.stringify(data,null,2)+'\n');await fs.rename(tmp,output)}
async function fail(message){await save({...(previous||{events:[]}),source:'Finnhub earnings calendar',checkedAt:collectedAt,status:'error',error:message});console.error(`earnings ${message}`);process.exit(1)}
if(!token)await fail('FINNHUB_API_KEY 미등록');
let universe;try{universe=JSON.parse(await fs.readFile(universeFile,'utf8'))}catch{await fail('universe.json 없음')}
const members=new Map(universe.assets.filter(a=>a.kind==='stock').map(a=>[a.symbol,a]));
// Finnhub truncates wide ranges, so request week-sized windows.
async function fetchRange(start,end){
 for(let attempt=0;attempt<3;attempt++){
  try{
   const r=await fetch(`https://finnhub.io/api/v1/calendar/earnings?from=${start}&to=${end}`,{headers:{'X-Finnhub-Token':token},signal:AbortSignal.timeout(30000)});
   if(r.ok){const body=await r.json();if(!Array.isArray(body?.earningsCalendar))await fail('응답 형식 오류');return body.earningsCalendar}
   if(r.status!==429&&r.status<500)await fail(`HTTP ${r.status}`);
  }catch(e){if(attempt===2)await fail(e.message)}
  await new Promise(res=>setTimeout(res,3000*(attempt+1)));
 }
 await fail('재시도 초과');
}
const rows=[];
for(let d=new Date(`${from}T00:00:00Z`);d.toISOString().slice(0,10)<=to;d.setUTCDate(d.getUTCDate()+7)){
 const end=new Date(Math.min(d.getTime()+6*864e5,Date.parse(`${to}T00:00:00Z`))).toISOString().slice(0,10);
 rows.push(...await fetchRange(d.toISOString().slice(0,10),end));
 await new Promise(res=>setTimeout(res,1100));
}
const body={earningsCalendar:[...new Map(rows.map(e=>[`${e.symbol}-${e.date}`,e])).values()]};
const hours={bmo:'장 시작 전',amc:'장 마감 후',dmh:'장중'};
const events=body.earningsCalendar.filter(e=>members.has(e.symbol)&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)).map(e=>{const a=members.get(e.symbol);return {date:e.date,symbol:e.symbol,name:a.name,sector:a.sector,hour:hours[e.hour]||'시각 미확인',quarter:e.quarter??null,year:e.year??null,epsEstimate:Number.isFinite(e.epsEstimate)?e.epsEstimate:null,revenueEstimate:Number.isFinite(e.revenueEstimate)?e.revenueEstimate:null}}).sort((a,b)=>a.date.localeCompare(b.date)||(b.revenueEstimate??0)-(a.revenueEstimate??0));
await save({source:'Finnhub earnings calendar',sourceUrl:'https://finnhub.io/docs/api/earnings-calendar',scope:'S&P 500 constituents',from,to,checkedAt:collectedAt,collectedAt,status:'ok',events});
console.log(`earnings ${from}..${to}: ${events.length} S&P 500 events`);
