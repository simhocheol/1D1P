// Hourly bars for the money-flow strip: Alpaca SIP (all US venues, 16+ minutes old so free) for ETFs,
// Binance public market data for crypto (includes taker-buy volume for trade strength).
import {flowClasses,symbolFlow,classFlow} from '../../server/fund-flow.js';
export async function fundFlows({headers,at=new Date()}){
 const stats={},errors=[];
 const etfs=flowClasses.filter(c=>!c.crypto).flatMap(c=>c.symbols),end=new Date(at-16*6e4),start=new Date(at-35*864e5);
 // Alpaca hourly bars are labelled by start time; drop the bar still in progress.
 const done=b=>Date.parse(b.t)+3600e3<=end.getTime();
 try{const u=new URL('https://data.alpaca.markets/v2/stocks/bars');u.search=new URLSearchParams({symbols:etfs.join(','),timeframe:'1Hour',start:start.toISOString(),end:end.toISOString(),feed:'sip',limit:'10000'});let token;const bars={};
  do{if(token)u.searchParams.set('page_token',token);const r=await fetch(u,{headers,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`alpaca HTTP ${r.status}`);const d=await r.json();for(const [s,b] of Object.entries(d.bars||{}))(bars[s]||=[]).push(...b);token=d.next_page_token}while(token);
  for(const [s,b] of Object.entries(bars)){const last=b.filter(done);
   // Only a fresh hour counts (the market may be closed): the last complete bar must end within 2 hours.
   if(last.length&&end-Date.parse(last.at(-1).t)<=3*3600e3)stats[s]=symbolFlow(last.map(x=>({t:x.t,o:x.o,c:x.c,v:x.v})))}}catch(e){errors.push(e.message)}
 for(const s of flowClasses.find(c=>c.crypto).symbols){
  try{const r=await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${s}&interval=1h&limit=600`,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`binance HTTP ${r.status}`);
   const k=(await r.json()).filter(x=>x[6]<at.getTime());stats[s]=symbolFlow(k.map(x=>({t:new Date(x[0]).toISOString(),o:+x[1],c:+x[4],v:+x[5],tb:+x[9]})))}catch(e){errors.push(`${s}: ${e.message}`)}
 }
 return {flows:flowClasses.map(c=>classFlow(c,stats)),errors};
}
