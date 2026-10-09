// Hourly: candidates from Alpaca's most-active screener (S&P 500 only), 5-minute SIP bars for the last
// ~30 days (free SIP needs data at least 15 minutes old), then tick-rule trade strength for the leaders.
import fs from 'node:fs/promises';
import {barMetrics,tradeStrength,rankActive} from '../../server/active-stocks.js';
export async function activeStocks({headers,at=new Date(),prefer=new Set()}){
 const get=async u=>{const r=await fetch(u,{headers,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`${u.pathname} HTTP ${r.status}`);return r.json()};
 const universe=JSON.parse(await fs.readFile(new URL('../../public/data/universe.json',import.meta.url),'utf8')).assets.filter(a=>a.kind==='stock');
 const info=new Map(universe.map(a=>[a.symbol,a]));
 let candidates=[];
 try{const d=await get(new URL('https://data.alpaca.markets/v1beta1/screener/stocks/most-actives?by=volume&top=100'));candidates=(d.most_actives||[]).map(x=>x.symbol).filter(s=>info.has(s)).sort((a,b)=>prefer.has(info.get(b).sector)-prefer.has(info.get(a).sector)).slice(0,50)}catch(e){return {items:[],error:`screener ${e.message}`}}
 if(!candidates.length)return {items:[],error:'no candidates'};
 const end=new Date(at-16*6e4),start=new Date(at-32*864e5),bars={};
 const u=new URL('https://data.alpaca.markets/v2/stocks/bars');u.search=new URLSearchParams({symbols:candidates.join(','),timeframe:'5Min',start:start.toISOString(),end:end.toISOString(),feed:'sip',limit:'10000'});let token;
 do{if(token)u.searchParams.set('page_token',token);const d=await get(u);for(const [s,b] of Object.entries(d.bars||{}))(bars[s]||=[]).push(...b);token=d.next_page_token}while(token);
 // Judge the last 5-minute bar that has fully closed before the free-data cutoff.
 const rows=[];
 for(const s of candidates){const b=(bars[s]||[]).filter(x=>Date.parse(x.t)+5*6e4<=end.getTime()).map(x=>({t:x.t,o:x.o,c:x.c,v:x.v,vw:x.vw}));const m=b.length?barMetrics(b):null;if(m&&end-Date.parse(m.at)<=20*6e4)rows.push({symbol:s,name:info.get(s).name,sector:info.get(s).sector,...m})}
 // Trade strength is costly: measure the favored sectors' leaders first, then a few others.
 const hot=rows.filter(r=>r.ratio>=1.5).sort((a,b)=>b.ratio-a.ratio);
 const leaders=[...hot.filter(r=>prefer.has(r.sector)).slice(0,10),...hot.filter(r=>!prefer.has(r.sector)).slice(0,4)];
 for(const r of leaders){
  const tu=new URL('https://data.alpaca.markets/v2/stocks/trades');tu.search=new URLSearchParams({symbols:r.symbol,start:r.at,end:new Date(Date.parse(r.at)+5*6e4).toISOString(),feed:'sip',limit:'10000'});const trades=[];let t;
  try{do{if(t)tu.searchParams.set('page_token',t);const d=await get(tu);trades.push(...(d.trades?.[r.symbol]||[]));t=d.next_page_token}while(t&&trades.length<60000);r.strength=tradeStrength(trades)}catch{}
 }
 const judged=leaders[0]?.at||rows[0]?.at||null;
 return {items:rankActive(leaders),ranked:rankActive(leaders,20),barStart:judged,candidates:candidates.length,measured:rows.length};
}
