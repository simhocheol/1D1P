import fs from 'node:fs/promises';
import {parse} from 'csv-parse/sync';
import {summarize,association} from '../server/market-metrics.js';
import {seal} from '../server/market-vault.js';
import {buildSignalReport} from '../server/signal-engine.js';
import {classifyEvidence} from './lib/classify-evidence.mjs';
const source='https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv';
const output=new URL('../public/data/universe.json',import.meta.url);
const checkedAt=new Date().toISOString();
const etfs=['SPY','QQQ','DIA','IWM','VTI','VOO','XLK','XLF','XLE','XLV','XLY','XLP','XLI','XLB','XLU','XLRE','XLC','SMH','SOXX','TLT','IEF','SHY','GLD','SLV','USO','HYG','LQD','ARKK','IBIT'];
async function request(url,headers={}){
 for(let attempt=0;attempt<3;attempt++){
  const r=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});
  if(r.ok)return r;
  if((r.status===429||r.status>=500)&&attempt<2){await new Promise(resolve=>setTimeout(resolve,3000*(attempt+1)));continue}
  throw Error(`HTTP ${r.status}`);
 }
}
let previous;try{previous=JSON.parse(await fs.readFile(output,'utf8'))}catch{}
let stocks,sourceStatus='ok';
try{
 const rows=parse(await (await request(source)).text(),{columns:true,skip_empty_lines:true});
 stocks=rows.map(r=>({symbol:r.Symbol,name:r.Security,sector:r['GICS Sector'],industry:r['GICS Sub-Industry'],hq:r['Headquarters Location']||'',founded:r.Founded||'',kind:'stock'}));
 if(stocks.length<450||stocks.length>550||new Set(stocks.map(s=>s.symbol)).size!==stocks.length||stocks.some(s=>!s.name||!/^[A-Z0-9.\-]+$/.test(s.symbol)))throw Error('Invalid constituent list');
}catch{if(!previous)throw Error('Constituent list unavailable');stocks=previous.assets.filter(s=>s.kind==='stock');sourceStatus='stale'}
const assets=[...stocks,...etfs.map(symbol=>({symbol,name:symbol,sector:'ETF',industry:'',kind:'etf'}))];
let key=process.env.ALPACA_API_KEY,secret=process.env.ALPACA_SECRET_KEY;
if(process.env.ALPACA_CREDENTIALS_JSON){const bundle=JSON.parse(process.env.ALPACA_CREDENTIALS_JSON);key=bundle.apiKey;secret=bundle.secretKey}
const bars={},errors=[];
if(key&&secret){
 const end=new Date(Date.now()-20*60*1000),start=new Date(end.getTime()-260*86400000);
 // Exclude today's unfinished regular-session bar, including the premarket slot.
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(end);
 const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',hourCycle:'h23'}).format(end));
 for(let i=0;i<assets.length;i+=50){
  const chunk=assets.slice(i,i+50),symbols=chunk.map(s=>s.symbol);let pageToken;
  try{do{
   const url=new URL('https://data.alpaca.markets/v2/stocks/bars');
   url.search=new URLSearchParams({symbols:symbols.join(','),timeframe:'1Day',start:start.toISOString(),end:end.toISOString(),limit:'10000',feed:'iex',adjustment:'split',sort:'asc',...(pageToken?{page_token:pageToken}:{})}).toString();
   const data=await (await request(url,{'APCA-API-KEY-ID':key,'APCA-API-SECRET-KEY':secret})).json();
   if(!data.bars||typeof data.bars!=='object')throw Error('Malformed bars');
   for(const [symbol,rows] of Object.entries(data.bars)){
    if(!symbols.includes(symbol)||!Array.isArray(rows))throw Error('Malformed symbol');
    for(const b of rows){if(!Number.isFinite(Date.parse(b.t))||!['o','h','l','c','v'].every(k=>Number.isFinite(b[k]))||b.c<=0||b.v<0)throw Error('Malformed bar')}
    const completed=rows.filter(b=>hour>=16||new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date(b.t))<today);
    bars[symbol]=[...(bars[symbol]||[]),...completed];
   }
   pageToken=data.next_page_token;
  }while(pageToken)}catch{for(const s of symbols){delete bars[s];errors.push(s)}}
 }
}
const metrics=Object.fromEntries(Object.entries(bars).map(([s,b])=>[s,summarize(b)]));
const proxies={SPY:'미국 주식시장',QQQ:'성장주',TLT:'장기 국채',GLD:'금',USO:'원유 ETF'};
for(const [symbol,m] of Object.entries(metrics))if(m){m.associations=Object.entries(proxies).filter(([p])=>p!==symbol&&bars[p]).map(([p,label])=>({symbol:p,label,...association(bars[symbol],bars[p])})).filter(p=>p.samples).sort((a,b)=>Math.abs(b.correlation)-Math.abs(a.correlation));m.relativeToSPY=m.date===metrics.SPY?.date&&Number.isFinite(m.change)&&Number.isFinite(metrics.SPY.change)?m.change-metrics.SPY.change:null}
const news={},newsErrors=[];
if(key&&secret)for(let i=0;i<assets.length;i+=50){
 const symbols=assets.slice(i,i+50).map(s=>s.symbol);
 try{
  const url=new URL('https://data.alpaca.markets/v1beta1/news');
  url.search=new URLSearchParams({symbols:symbols.join(','),start:new Date(Date.now()-7*86400000).toISOString(),limit:'50',sort:'desc',include_content:'false'}).toString();
  const result=await (await request(url,{'APCA-API-KEY-ID':key,'APCA-API-SECRET-KEY':secret})).json();
  if(!Array.isArray(result.news))throw Error();
  for(const item of result.news){let url;try{url=new URL(item.url);if(url.protocol!=='https:')continue}catch{continue}for(const symbol of item.symbols||[])if(symbols.includes(symbol)){(news[symbol]??=[]).push({title:item.headline,summary:(item.summary||'').slice(0,600),url:url.href,source:item.source,publishedAt:item.created_at})}}
 }catch{newsErrors.push(...symbols)}
}
const coverage=assets.filter(s=>metrics[s.symbol]).length;
const metadata={checkedAt,source,sourceStatus,scope:'current S&P 500 constituents + curated ETF watch universe (not all ETFs)',feed:'iex',adjustment:'split',status:!key||!secret?'missing_keys':errors.length?'partial':'ok',coverage,total:assets.length,failedSymbols:errors,newsStatus:!key||!secret?'missing_keys':newsErrors.length?'partial':'ok',newsSymbols:Object.keys(news).length,newsFailedSymbols:newsErrors,assets};
await fs.mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
await fs.writeFile(output,JSON.stringify(metadata,null,2)+'\n');
await fs.mkdir('private-market',{recursive:true});
let events=[];try{events=JSON.parse(await fs.readFile(new URL('../public/data/official-feed.json',import.meta.url),'utf8')).events||[]}catch{}
let macro=null,filings=null;try{macro=JSON.parse(await fs.readFile('private-market/macro.json','utf8'))}catch{}
try{filings=JSON.parse(await fs.readFile('private-market/filings.json','utf8'))}catch{}
let classified=null;
if(process.env.OPENAI_API_KEY){try{classified=await classifyEvidence({news,filings,key:process.env.OPENAI_API_KEY,ua:process.env.SEC_CONTACT_EMAIL?`1D1P market research ${process.env.SEC_CONTACT_EMAIL}`:null});console.log(`Classified ${Object.keys(classified.items).length}/${classified.inputs} items with ${classified.model}${classified.errors.length?` · ${classified.errors.length} batch errors`:''}`)}catch(e){console.error(`classification skipped: ${e.message}`)}}
if(secret)await fs.writeFile('private-market/market.enc',seal({...metadata,metrics,bars,news,newsErrors,events,macro,filings,classified,newsScope:'last 7 days, up to 50 recent articles per 50-symbol batch; not exhaustive'},secret));
const report=buildSignalReport({assets,bars,news,events,macro,filings,classified});
console.log(`Signal report ${report.date}; price anomalies=${report.stocks.length}; Driver candidates=${report.thesis?.candidates.length||0}; connected sectors=${report.thesis?.sectors.length||0}; observed drivers=${report.thesis?.drivers.filter(d=>d.status==="observed").map(d=>`${d.id}(${d.sectorIds.length}s/${d.candidateSymbols.length}c)`).join(",")||"none"}`);
console.log(`Market universe ${assets.length}; data coverage ${coverage}; failed ${errors.length}; feed IEX; private storage only`);
if(metadata.status!=='ok'||sourceStatus!=='ok')process.exitCode=1;
