import {association,summarize} from './market-metrics.js';
import {buildDriverThesis} from './driver-thesis.js';
import {macroSeries,macroSignal} from './macro-series.js';
import {filingEvidence} from './edgar.js';
import {etInstant} from '../src/publish-schedule.js';
const etDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}),etHour=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',hourCycle:'h23'});
const dayCache=new Map();
const day=t=>{let d=dayCache.get(t);if(d===undefined){d=etDate.format(new Date(t));if(dayCache.size>200000)dayCache.clear();dayCache.set(t,d)}return d};
const sectorETF={'Information Technology':'XLK',Financials:'XLF',Energy:'XLE','Health Care':'XLV','Consumer Discretionary':'XLY','Consumer Staples':'XLP',Industrials:'XLI',Materials:'XLB',Utilities:'XLU','Real Estate':'XLRE','Communication Services':'XLC'};
const proxies={SPY:'시장 위험선호',QQQ:'성장주 기대',TLT:'장기 국채 가격 · 금리 역방향 대리',GLD:'금 가격',USO:'원유 ETF 가격'};
function movement(rows){
 const m=summarize(rows);if(!m)return null;
 const prior=rows.slice(1,-1).map((b,i)=>(b.c/rows[i].c-1)*100).filter(Number.isFinite).slice(-60);
 const mean=prior.length?prior.reduce((a,b)=>a+b,0)/prior.length:null;
 const sd=prior.length>=30?Math.sqrt(prior.reduce((s,v)=>s+(v-mean)**2,0)/(prior.length-1)):null;
 return {...m,z:sd>0&&Number.isFinite(m.change)?(m.change-mean)/sd:null};
}
const r2=v=>Math.round(v*100)/100;
// Daily candles for the calendar month before asOf, with 20/50/60/120-day moving averages.
export function dailyChart(rows,asOf){
 const [y,m,d]=asOf.split('-').map(Number),from=new Date(Date.UTC(y,m-2,d)).toISOString().slice(0,10);
 const sum=[0];for(const b of rows)sum.push(sum.at(-1)+b.c);
 const ma=n=>rows.map((_,i)=>i+1>=n?r2((sum[i+1]-sum[i+1-n])/n):null);
 const all={20:ma(20),50:ma(50),60:ma(60),120:ma(120)},start=rows.findIndex(b=>day(b.t)>from);
 if(start<0)return null;
 return {from,to:asOf,bars:rows.slice(start).map(b=>({d:day(b.t),o:r2(b.o),h:r2(b.h),l:r2(b.l),c:r2(b.c)})),ma:Object.fromEntries(Object.entries(all).map(([k,v])=>[k,v.slice(start)]))};
}
// Regular-session move (open → close) of the last bar.
const intradayChange=r=>{const b=r?.at(-1);return b&&b.o>0&&Number.isFinite(b.c)?(b.c/b.o-1)*100:null};
function inReactionWindow(t,date,previousDate){
 if(!Number.isFinite(Date.parse(t)))return false;
 const d=day(t),hour=Number(etHour.format(new Date(t)));
 if(d===date)return hour<16;
 if(!previousDate)return false;
 return d>previousDate&&d<date||d===previousDate&&hour>=16;
}
export function buildSignalReport({assets=[],bars={},news={},events=[],macro=null,filings=null,classified=null,premarket=null,session='post',date}={}){
 const pre=session==='pre';
 const latest=pre?Object.keys(premarket||{}).sort().at(-1):bars.SPY?.at(-1)?.t?day(bars.SPY.at(-1).t):null;const asOf=date||latest||null;
 if(!asOf)return {date:null,session,drivers:[],sectors:[],stocks:[],status:'missing_data'};
 // Pre-market: previous closes plus a synthetic bar at the publication cutoff (09:15 ET), compared with the prior close.
 const snap=pre?premarket?.[asOf]:null;
 if(pre&&!snap)return {date:asOf,session,drivers:[],sectors:[],stocks:[],status:'missing_data'};
 const cutoffMs=snap?Date.parse(snap.cutoff):null;
 // Non-overlapping evidence windows: pre = prior close 16:00 → 09:15 ET, post = 09:15 → 16:00 ET on the report date.
 const [ay,am,ad]=asOf.split('-').map(Number),publishMs=etInstant(ay,am,ad,9,15).getTime(),closeMs=etInstant(ay,am,ad,16,0).getTime();
 const win=(t,d,p)=>{const ms=Date.parse(t);if(!Number.isFinite(ms))return false;return pre?inReactionWindow(t,d,p)&&ms<=cutoffMs:ms>=publishMs&&ms<closeMs};
 const rows=Object.fromEntries(Object.entries(bars).map(([s,b])=>{const r=b.filter(v=>pre?day(v.t)<asOf:day(v.t)<=asOf).sort((a,b)=>Date.parse(a.t)-Date.parse(b.t));const q=snap?.prices?.[s];if(q&&r.length)r.push({t:snap.cutoff,o:r.at(-1).c,h:Math.max(r.at(-1).c,q.h??q.c),l:Math.min(r.at(-1).c,q.l??q.c),c:q.c,v:q.v??0});return [s,r]}));
 const metrics=Object.fromEntries(Object.entries(rows).map(([s,b])=>[s,movement(b)]));
 const valid=s=>metrics[s]?.date===asOf&&Number.isFinite(metrics[s]?.change);
 const drivers=Object.entries(proxies).map(([symbol,label])=>{const m=valid(symbol)?metrics[symbol]:null;return {symbol,label,change:m?.change??null,intraday:m&&!pre?intradayChange(rows[symbol]):null,z:m?.z??null,active:!!m&&(Math.abs(m.change)>=1||Math.abs(m.z??0)>=1.5)}});
 const sectors=Object.entries(sectorETF).map(([name,symbol])=>{
  const members=assets.filter(a=>a.kind==='stock'&&a.sector===name),covered=members.filter(a=>valid(a.symbol));
  const m=valid(symbol)?metrics[symbol]:null,spy=valid('SPY')?metrics.SPY:null;
  const relative=m&&spy?m.change-spy.change:null;
  const coverage=members.length?covered.length/members.length:0;
  const reactions=coverage>=0.6&&m?drivers.filter(d=>d.active&&d.symbol!==symbol).flatMap(d=>{
   // Fit exposure before the observation day, avoiding circular use of today's move.
   const exposure=association((rows[symbol]||[]).slice(0,-1),(rows[d.symbol]||[]).slice(0,-1));
   return exposure&&Math.abs(exposure.correlation)>=0.35&&Math.sign(exposure.beta*d.change)===Math.sign(m.change)&&Math.abs(m.change)>=0.5?[{...d,...exposure}]:[];
  }):[];
  const intraday=m&&!pre?intradayChange(rows[symbol]):null;
  return {name,symbol,change:m?.change??null,intraday,relative,coverage,covered:covered.length,total:members.length,breadth:covered.length?covered.filter(a=>metrics[a.symbol].change>0).length/covered.length:null,candidates:reactions,active:coverage>=0.6&&!!m&&(Math.abs(relative??0)>=0.5||Math.abs(m.z??0)>=1.5||reactions.length>0)};
 });
 const stocks=assets.filter(a=>a.kind==='stock'&&valid(a.symbol)).flatMap(a=>{
  const m=metrics[a.symbol],sector=sectors.find(s=>s.name===a.sector),relative=sector?.change!=null?m.change-sector.change:null;
  const reasons=[];
  if(Math.abs(m.change)>=1&&Math.abs(m.z??0)>=2)reasons.push('평소 변동 대비 2σ 이상');
  if(Math.abs(m.change)>=1&&(m.volumeRatio??0)>=2)reasons.push('거래량 20일 평균의 2배 이상');
  if(Math.abs(m.change)>=1&&relative!=null&&Math.abs(relative)>=1.5)reasons.push('섹터 대비 1.5%p 이상 차이');
  if(!reasons.length)return [];
  const evidence=(news[a.symbol]||[]).filter(n=>win(n.publishedAt,asOf,rows[a.symbol]?.at(-2)?.t?day(rows[a.symbol].at(-2).t):null));
  const candidates=sector?.candidates.filter(d=>Math.sign(d.beta*d.change)===Math.sign(m.change))||[];
  const score=Math.min(Math.abs(m.z??0),5)*10+Math.min(m.volumeRatio??0,5)*5+Math.min(Math.abs(relative??0),5)*5;
  return [{...a,...m,intraday:pre?null:intradayChange(rows[a.symbol]),spark:(rows[a.symbol]||[]).slice(-30).map(v=>r2(v.c)),chart:dailyChart(rows[a.symbol]||[],asOf),relativeToSector:relative,reasons,score,candidates,evidence,state:evidence.length?'관련 근거 있음 · 인과 미확정':candidates.length?'Driver 영향 후보 · 인과 미확정':'변화 감지 · 원인 미확인'}];
 }).sort((a,b)=>b.score-a.score||a.symbol.localeCompare(b.symbol));
 const report={date:asOf,session,cutoff:snap?.cutoff||null,status:valid('SPY')?'ok':'missing_benchmark',drivers,sectors,stocks,events:events.filter(e=>win(e.publishedAt,asOf,rows.SPY?.at(-2)?.t?day(rows.SPY.at(-2).t):null)),coverage:assets.filter(a=>a.kind==='stock'&&valid(a.symbol)).length,total:assets.filter(a=>a.kind==='stock').length,method:'rules-v2; driver-aligned candidates, not proven causation or trading recommendations'};
 const windowNews=Object.fromEntries(assets.filter(a=>a.kind==='stock'&&valid(a.symbol)).map(a=>[a.symbol,(news[a.symbol]||[]).filter(e=>win(e.publishedAt,asOf,rows[a.symbol]?.at(-2)?.t?day(rows[a.symbol].at(-2).t):null))]));
 const prevSpy=rows.SPY?.at(-2)?.t?day(rows.SPY.at(-2).t):null;
 report.macro=macro?.series?macroSeries.map(s=>macroSignal(s,macro.series[s.id],asOf,t=>win(t,asOf,prevSpy))).filter(Boolean):[];
 const windowFilings={};for(const f of filings?.filings||[]){if(!assets.some(a=>a.symbol===f.symbol))continue;const prevDay=rows[f.symbol]?.at(-2)?.t?day(rows[f.symbol].at(-2).t):prevSpy;if(win(f.acceptedAt,asOf,prevDay))(windowFilings[f.symbol]??=[]).push(...filingEvidence(f))}
 report.filingCount=Object.values(windowFilings).flat().length;
 report.thesis=buildDriverThesis({report,rows,windowNews,windowFilings,classified,macro,asOf});
 // Charts are only rendered for candidates; keep the response small.
 for(const s of report.stocks)delete s.chart;
 return report;
}
