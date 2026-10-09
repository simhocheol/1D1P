// Collects a market pulse every 4 hours and appends it to the public history.
// Prices stay in memory; only group levels, the pattern and the summary are written.
import fs from 'node:fs/promises';
import {explainMovers} from './lib/pulse-why.mjs';
import {pulseSymbols,dailySigma,buildPulse,appendPulse,etSession} from '../server/market-pulse.js';
const output=new URL('../public/data/pulse/history.json',import.meta.url);
const at=new Date();
if(etSession(at)==='closed'&&!process.argv.includes('--force')){console.log('US market closed (ET); pulse skipped');process.exit(0)}
let key=process.env.ALPACA_API_KEY,secret=process.env.ALPACA_SECRET_KEY;
if(process.env.ALPACA_CREDENTIALS_JSON){const b=JSON.parse(process.env.ALPACA_CREDENTIALS_JSON);key=b.apiKey;secret=b.secretKey}
if(!key||!secret)throw Error('Alpaca credentials missing');
const headers={'APCA-API-KEY-ID':key,'APCA-API-SECRET-KEY':secret};
async function get(url){for(let i=0;i<3;i++){const r=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});if(r.ok)return r.json();if(r.status<500&&r.status!==429)throw Error(`HTTP ${r.status} ${url.pathname}`);await new Promise(s=>setTimeout(s,1000*(i+1)))}throw Error(`HTTP retry exhausted ${url.pathname}`)}
// Probe: is the overnight (Blue Ocean) feed available on this plan? Logs status and trade times only, no prices.
if(process.argv.includes('--probe')){for(const feed of ['overnight','boats']){const u=new URL('https://data.alpaca.markets/v2/stocks/snapshots');u.searchParams.set('symbols','SPY,QQQ,TLT');u.searchParams.set('feed',feed);const r=await fetch(u,{headers,signal:AbortSignal.timeout(30000)});let note='';if(r.ok){const d=await r.json();note=Object.entries(d).map(([s,v])=>`${s}:${v?.latestTrade?.t||'none'}`).join(' ')}else note=(await r.text()).slice(0,160);console.log(`probe feed=${feed} HTTP ${r.status} ${note}`)}}
const stocks=pulseSymbols.filter(s=>!s.includes('/')),crypto=pulseSymbols.filter(s=>s.includes('/'));
const etDay=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date(t));
const session=etSession(at),today=etDay(at),start=new Date(at-120*86400000).toISOString();
// Latest trade vs the last completed regular close; stale trades (> 6h) are left out.
function move(snap,sameDay){
 const p=snap?.latestTrade?.p,t=snap?.latestTrade?.t;if(!p||!t||at-new Date(t)>6*3600000)return null;
 const base=sameDay(snap.dailyBar?.t)?snap.prevDailyBar?.c:snap.dailyBar?.c;return base>0?(p/base-1)*100:null;
}
async function stockSnapshots(){
 for(const feed of session==='overnight'?['overnight']:['delayed_sip','iex']){try{const u=new URL('https://data.alpaca.markets/v2/stocks/snapshots');u.searchParams.set('symbols',stocks.join(','));u.searchParams.set('feed',feed);return {feed,data:await get(u)}}catch(e){console.warn(`snapshots ${feed}: ${e.message}`)}}
 throw Error('stock snapshots unavailable');
}
const closes={},lastClose={};
// Overnight compares with the latest regular close: today's after 20:00 ET, the previous day's before 04:00.
const refOk=t=>session==='overnight'&&+new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',hourCycle:'h23'}).format(at)>=20?etDay(t)<=today:etDay(t)<today;
{const u=new URL('https://data.alpaca.markets/v2/stocks/bars');u.searchParams.set('symbols',stocks.join(','));u.searchParams.set('timeframe','1Day');u.searchParams.set('start',start);u.searchParams.set('feed','iex');u.searchParams.set('limit','10000');let token;
 do{if(token)u.searchParams.set('page_token',token);const d=await get(u);for(const [s,b] of Object.entries(d.bars||{})){(closes[s]||=[]).push(...b.filter(x=>etDay(x.t)<today).map(x=>x.c));const last=b.filter(x=>refOk(x.t)).at(-1);if(last)lastClose[s]=last.c}token=d.next_page_token}while(token)}
{const u=new URL('https://data.alpaca.markets/v1beta3/crypto/us/bars');u.searchParams.set('symbols',crypto.join(','));u.searchParams.set('timeframe','1Day');u.searchParams.set('start',start);u.searchParams.set('limit','1000');const d=await get(u);for(const [s,b] of Object.entries(d.bars||{}))closes[s]=b.slice(0,-1).map(x=>x.c)}
const moves={};
const {feed,data:snaps}=await stockSnapshots();
const overnightMove=s=>{const p=snaps[s]?.latestTrade?.p,t=snaps[s]?.latestTrade?.t;return p&&t&&at-new Date(t)<=2*3600000&&lastClose[s]>0?(p/lastClose[s]-1)*100:null};
for(const s of stocks)moves[s]={change:session==='overnight'?overnightMove(s):move(snaps[s],t=>t&&etDay(t)===today),sigma:dailySigma(closes[s]||[])};
{const u=new URL('https://data.alpaca.markets/v1beta3/crypto/us/snapshots');u.searchParams.set('symbols',crypto.join(','));const d=await get(u);const utc=at.toISOString().slice(0,10);
 for(const s of crypto)moves[s]={change:move(d.snapshots?.[s],t=>t&&t.slice(0,10)===utc),sigma:dailySigma(closes[s]||[])}}
const pulse=buildPulse({moves,at});
// Why the biggest movers moved (news + OpenAI). A failure here never blocks the pulse itself.
try{const w=await explainMovers({groups:pulse.groups,alpacaHeaders:headers,openaiKey:process.env.OPENAI_API_KEY});pulse.why=w.cards;console.log(`Why cards ${w.cards.length}${w.note?` (${w.note})`:''}${w.news!=null?` · news ${w.news}`:''}${w.errors?.length?` · errors: ${w.errors.join('; ')}`:''}`)}catch(e){console.warn(`why skipped: ${e.message}`)}
let history=null;try{history=JSON.parse(await fs.readFile(output,'utf8'))}catch{}
await fs.mkdir(new URL('.',output),{recursive:true});
await fs.writeFile(output,JSON.stringify(appendPulse(history,pulse))+'\n');
console.log(`Pulse ${pulse.at} ${pulse.session} feed=${feed} symbols=${Object.values(moves).filter(m=>Number.isFinite(m.change)).length}/${pulseSymbols.length} pattern=${pulse.pattern.id}`);
