// Daily after the US close: log today's funnel and score earlier entries → public/data/validation.json.
import fs from 'node:fs/promises';
import {snapshot,evaluate,summarize} from '../server/validation.js';
const file='public/data/validation.json';
const read=async p=>{try{return JSON.parse(await fs.readFile(p,'utf8'))}catch{return null}};
const log=(await read(file))||{version:1,records:[]};const funnel=await read('public/data/pulse/funnel.json');
const etDate=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date(t));
if(funnel?.favored?.length){const d=etDate(funnel.updatedAt),wd=new Date(`${d}T12:00:00Z`).getUTCDay();if(wd>0&&wd<6&&!log.records.some(r=>r.date===d))log.records.push(snapshot(funnel,d))}
log.records=log.records.slice(-120);
let key=process.env.ALPACA_API_KEY,secret=process.env.ALPACA_SECRET_KEY;
if(process.env.ALPACA_CREDENTIALS_JSON){const b=JSON.parse(process.env.ALPACA_CREDENTIALS_JSON);key=b.apiKey;secret=b.secretKey}
const pending=log.records.filter(r=>!r.outcomes?.[5]);
if(pending.length&&key){
 const syms=[...new Set(['SPY',...pending.flatMap(r=>[...r.favored.map(f=>f.etf),...r.picks.flatMap(p=>[p.symbol,p.etf])])].filter(Boolean))];
 const start=new Date(Date.parse(pending[0].date)-5*864e5).toISOString(),closes={};
 for(let i=0;i<syms.length;i+=100){const u=new URL('https://data.alpaca.markets/v2/stocks/bars');u.search=new URLSearchParams({symbols:syms.slice(i,i+100).join(','),timeframe:'1Day',start,end:new Date(Date.now()-16*6e4).toISOString(),feed:'sip',adjustment:'all',limit:'10000'});let t;
  do{if(t)u.searchParams.set('page_token',t);const r=await fetch(u,{headers:{'APCA-API-KEY-ID':key,'APCA-API-SECRET-KEY':secret},signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`bars HTTP ${r.status}`);const d=await r.json();
   for(const [s,b] of Object.entries(d.bars||{}))(closes[s]||=[]).push(...b.map(x=>({d:etDate(x.t),c:x.c})));t=d.next_page_token}while(t)}
 for(const r of pending)evaluate(r,closes);
}
log.updatedAt=new Date().toISOString();log.summary={d1:summarize(log.records,1),d5:summarize(log.records,5)};
await fs.writeFile(file,JSON.stringify(log)+'\n');
console.log(`Validation records ${log.records.length} · scored d1 ${log.summary.d1.days} d5 ${log.summary.d5.days}`);
