// Collects a market pulse every hour, appends it to the public history and writes the hourly briefing.
// Prices stay in memory; only group levels, the pattern and the summary are written.
import fs from 'node:fs/promises';
import {buildBriefing} from './lib/pulse-briefing.mjs';
import {fundFlows} from './lib/fund-flow.mjs';
import {activeStocks} from './lib/active-stocks.mjs';
import {appendBriefing} from '../server/pulse-briefing.js';
import {pulseSymbols,dailySigma,buildPulse,appendPulse,etSession} from '../server/market-pulse.js';
const output=new URL('../public/data/pulse/history.json',import.meta.url);
const at=new Date();
if(etSession(at)==='closed'&&!process.argv.includes('--force')){console.log('US market closed (ET); pulse skipped');process.exit(0)}
// The external hourly trigger and GitHub's backup schedule can both fire: keep one pulse per ~hour.
try{const last=JSON.parse(await fs.readFile(new URL('../public/data/pulse/history.json',import.meta.url),'utf8')).items.at(-1);if(last&&at-new Date(last.at)<40*6e4&&!process.argv.includes('--force')){console.log('Pulse recorded under 40 minutes ago; skipped');process.exit(0)}}catch{}
let key=process.env.ALPACA_API_KEY,secret=process.env.ALPACA_SECRET_KEY;
if(process.env.ALPACA_CREDENTIALS_JSON){const b=JSON.parse(process.env.ALPACA_CREDENTIALS_JSON);key=b.apiKey;secret=b.secretKey}
if(!key||!secret)throw Error('Alpaca credentials missing');
const headers={'APCA-API-KEY-ID':key,'APCA-API-SECRET-KEY':secret};
async function get(url){for(let i=0;i<3;i++){const r=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});if(r.ok)return r.json();if(r.status<500&&r.status!==429)throw Error(`HTTP ${r.status} ${url.pathname}`);await new Promise(s=>setTimeout(s,1000*(i+1)))}throw Error(`HTTP retry exhausted ${url.pathname}`)}
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
let history=null;try{history=JSON.parse(await fs.readFile(output,'utf8'))}catch{}
await fs.mkdir(new URL('.',output),{recursive:true});
await fs.writeFile(output,JSON.stringify(appendPulse(history,pulse,60))+'\n');
// Hourly briefing on what changed since the previous pulse. Never blocks the pulse itself.
const briefFile=new URL('../public/data/pulse/briefing.json',import.meta.url);
// Crowded trading (regular session only); outside it the last session's list stays as is.
if(pulse.session==='regular'){try{const a=await activeStocks({headers,at});if(!a.error)await fs.writeFile(new URL('../public/data/pulse/active.json',import.meta.url),JSON.stringify({version:1,updatedAt:at.toISOString(),barStart:a.barStart,items:a.items})+'\n');console.log(`Active ${a.items.length}${a.error?` (${a.error})`:` · candidates ${a.candidates} · measured ${a.measured}`}`)}catch(e){console.warn(`active skipped: ${e.message}`)}}
let flows=[];try{const f=await fundFlows({headers,at});flows=f.flows;console.log(`Flows ${flows.filter(x=>x.dir).length}/${flows.length}${f.errors.length?` · errors: ${f.errors.join('; ')}`:''}`)}catch(e){console.warn(`flows skipped: ${e.message}`)}
try{const b=await buildBriefing({cur:pulse,prev:history?.items?.at(-1),alpacaHeaders:headers,openaiKey:process.env.OPENAI_API_KEY,flows});let old=null;try{old=JSON.parse(await fs.readFile(briefFile,'utf8'))}catch{}
 const {note,...item}=b;await fs.writeFile(briefFile,JSON.stringify(appendBriefing(old,item))+'\n');console.log(`Briefing ${item.ai?'AI':'fallback'} · ${note} · ${item.title}`)}catch(e){console.warn(`briefing skipped: ${e.message}`)}
console.log(`Pulse ${pulse.at} ${pulse.session} feed=${feed} symbols=${Object.values(moves).filter(m=>Number.isFinite(m.change)).length}/${pulseSymbols.length} pattern=${pulse.pattern.id}`);
