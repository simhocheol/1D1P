// Daily money and attention signals → public/data/flows.json (stages only).
// Sources: SPDR NAV history (sector ETF creations/redemptions), Alpaca daily bars (breadth) and news (attention),
// FRED (liquidity), CFTC legacy COT (positioning), Wikimedia pageviews (attention). Each part fails on its own.
import fs from 'node:fs/promises';
import {sectors} from '../server/sector-flow.js';
import {xlsxRows,etfFlow,flowStage,breadth,breadthStage,liquidity,cotPosition,attentionRatio,attentionStage,newsAttention} from '../server/flow-signals.js';
const out={version:1,generatedAt:new Date().toISOString(),errors:[]};
const step=async(name,fn)=>{try{await fn()}catch(e){out.errors.push(`${name}: ${String(e.message).slice(0,160)}`)}};
const universe=JSON.parse(await fs.readFile('public/data/universe.json','utf8')).assets.filter(a=>a.kind==='stock');
const sectorOf=new Map(universe.map(a=>[a.symbol,a.sector]));const sec=s=>sectorOf.get(s);
const ua={'User-Agent':`1D1P market observatory (${process.env.SEC_CONTACT_EMAIL||'contact via GitHub'})`};
let key=process.env.ALPACA_API_KEY,secret=process.env.ALPACA_SECRET_KEY;
if(process.env.ALPACA_CREDENTIALS_JSON){const b=JSON.parse(process.env.ALPACA_CREDENTIALS_JSON);key=b.apiKey;secret=b.secretKey}
const alpaca={'APCA-API-KEY-ID':key,'APCA-API-SECRET-KEY':secret};
const json=async(url,headers={})=>{const r=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`HTTP ${r.status} ${new URL(url).hostname}`);return r.json()};

// 1. Real sector ETF flows: Δ shares outstanding × NAV over 5 and 20 days, as a share of fund assets.
await step('etf',async()=>{out.etf={};for(const s of [...sectors.map(x=>x.etf),'SPY']){
 const r=await fetch(`https://www.ssga.com/library-content/products/fund-data/etfs/us/navhist-us-en-${s.toLowerCase()}.xlsx`,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(30000)});
 if(!r.ok){out.errors.push(`etf ${s}: HTTP ${r.status}`);continue}const f=etfFlow(xlsxRows(await r.arrayBuffer()));if(f)out.etf[s]={asOf:f.asOf,week:flowStage(f.pct5),month:flowStage(f.pct20)};
 await new Promise(x=>setTimeout(x,500))}});
// 2. Breadth across S&P 500 members from 80 days of daily closes.
await step('breadth',async()=>{if(!key)throw Error('Alpaca credentials missing');const closes={},syms=universe.map(a=>a.symbol);
 for(let i=0;i<syms.length;i+=100){const u=new URL('https://data.alpaca.markets/v2/stocks/bars');u.search=new URLSearchParams({symbols:syms.slice(i,i+100).join(','),timeframe:'1Day',start:new Date(Date.now()-120*864e5).toISOString(),end:new Date(Date.now()-16*6e4).toISOString(),feed:'sip',adjustment:'split',limit:'10000'});let t;
  do{if(t)u.searchParams.set('page_token',t);const d=await json(u,alpaca);for(const [s,b] of Object.entries(d.bars||{}))(closes[s]||=[]).push(...b.map(x=>x.c));t=d.next_page_token}while(t)}
 const b=breadth(closes,sec);if(!b)throw Error('too few symbols');
 out.breadth={count:b.count,today:breadthStage(b.up),trend:breadthStage(b.above50),sectors:Object.fromEntries(Object.entries(b.sectors).map(([k,v])=>[k,{today:breadthStage(v.up),trend:breadthStage(v.above50)}]))}});
// 3. News attention by sector from market-wide Alpaca news (8 days).
await step('news',async()=>{if(!key)throw Error('Alpaca credentials missing');const news=[];let t;
 for(let page=0;page<160;page++){const u=new URL('https://data.alpaca.markets/v1beta1/news');u.search=new URLSearchParams({start:new Date(Date.now()-8*864e5).toISOString(),limit:'50',sort:'desc',include_content:'false',...(t?{page_token:t}:{})});
  const d=await json(u,alpaca);for(const n of d.news||[])news.push({at:n.created_at,symbols:n.symbols||[]});t=d.next_page_token;if(!t)break}
 out.newsAttention=newsAttention(news,sec);out.newsCount=news.length});
// 4. Liquidity from FRED.
await step('liquidity',async()=>{const k=process.env.FRED_API_KEY;if(!k)throw Error('FRED_API_KEY missing');
 const fred=async id=>{const u=new URL('https://api.stlouisfed.org/fred/series/observations');u.search=new URLSearchParams({series_id:id,observation_start:new Date(Date.now()-400*864e5).toISOString().slice(0,10),api_key:k,file_type:'json'});const d=await json(u);return d.observations.filter(o=>o.value!=='.').map(o=>({d:o.date,v:+o.value}))};
 const [walcl,rrp,tga,mmf]=[await fred('WALCL'),await fred('RRPONTSYD'),await fred('WTREGEN'),await fred('WRMFNS')];out.liquidity=liquidity({walcl,rrp,tga,mmf})});
// 5. Large-trader (non-commercial) positioning, CFTC legacy futures-only report.
const cotMarkets={stocks:'E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE',nasdaq:'NASDAQ MINI - CHICAGO MERCANTILE EXCHANGE',treasury:'UST 10Y NOTE - CHICAGO BOARD OF TRADE',gold:'GOLD - COMMODITY EXCHANGE INC.',oil:'WTI-PHYSICAL - NEW YORK MERCANTILE EXCHANGE',dollar:'USD INDEX - ICE FUTURES U.S.',bitcoin:'BITCOIN - CHICAGO MERCANTILE EXCHANGE'};
await step('cot',async()=>{out.cot={};for(const [id,m] of Object.entries(cotMarkets)){
 const u=new URL('https://publicreporting.cftc.gov/resource/6dca-aqww.json');u.search=new URLSearchParams({$select:'report_date_as_yyyy_mm_dd,open_interest_all,noncomm_positions_long_all,noncomm_positions_short_all',$where:`market_and_exchange_names='${m}'`,$order:'report_date_as_yyyy_mm_dd DESC',$limit:'170'});
 const p=cotPosition(await json(u));if(p)out.cot[id]=p}});
// 6. Wikipedia attention for S&P 500 companies (article titles from the S&P 500 list page).
await step('wiki',async()=>{
 const w=await json('https://en.wikipedia.org/w/api.php?action=parse&page=List_of_S%26P_500_companies&prop=wikitext&format=json&formatversion=2',ua);
 const titles={};for(const line of w.parse.wikitext.split('\n|-')){const sym=/\{\{\s*(?:NyseSymbol|NasdaqSymbol)\s*\|\s*([A-Z.]+)/i.exec(line)?.[1];const art=/\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/.exec(line)?.[1];if(sym&&art&&sectorOf.has(sym))titles[sym]=art.trim()}
 const end=new Date(Date.now()-864e5),start=new Date(end-30*864e5),f=d=>d.toISOString().slice(0,10).replaceAll('-','');
 const entries=Object.entries(titles);const ratios={};
 for(let i=0;i<entries.length;i+=10){await Promise.all(entries.slice(i,i+10).map(async([s,t])=>{try{const d=await json(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(t.replaceAll(' ','_'))}/daily/${f(start)}/${f(end)}`,ua);const r=attentionRatio(d.items.map(x=>x.views));if(r!=null)ratios[s]=r}catch{}}))}
 const by={};for(const [s,r] of Object.entries(ratios))(by[sec(s)]||=[]).push(r);
 out.wiki={matched:Object.keys(titles).length,measured:Object.keys(ratios).length,
  top:Object.entries(ratios).filter(([,r])=>r>=1.5).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([s,r])=>({symbol:s,name:universe.find(a=>a.symbol===s)?.name,sector:sec(s),stage:attentionStage(r)})),
  sectors:Object.fromEntries(Object.entries(by).map(([k,v])=>{const m=[...v].sort((a,b)=>a-b)[Math.floor(v.length/2)];return [k,attentionStage(m)]}))}});
await fs.writeFile('public/data/flows.json',JSON.stringify(out)+'\n');
console.log(`Flows etf ${Object.keys(out.etf||{}).length} · breadth ${out.breadth?.count??0} · news ${out.newsCount??0} · liquidity ${out.liquidity?'ok':'-'} · cot ${Object.keys(out.cot||{}).length} · wiki ${out.wiki?.measured??0}/${out.wiki?.matched??0}${out.errors.length?` · errors: ${out.errors.join('; ')}`:''}`);
