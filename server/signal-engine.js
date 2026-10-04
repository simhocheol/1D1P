import {association,summarize} from './market-metrics.js';
import {buildDriverThesis} from './driver-thesis.js';
const day=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date(t));
const sectorETF={'Information Technology':'XLK',Financials:'XLF',Energy:'XLE','Health Care':'XLV','Consumer Discretionary':'XLY','Consumer Staples':'XLP',Industrials:'XLI',Materials:'XLB',Utilities:'XLU','Real Estate':'XLRE','Communication Services':'XLC'};
const proxies={SPY:'시장 위험선호',QQQ:'성장주 기대',TLT:'장기 국채 가격 · 금리 역방향 대리',GLD:'금 가격',USO:'원유 ETF 가격'};
function movement(rows){
 const m=summarize(rows);if(!m)return null;
 const prior=rows.slice(1,-1).map((b,i)=>(b.c/rows[i].c-1)*100).filter(Number.isFinite).slice(-60);
 const mean=prior.length?prior.reduce((a,b)=>a+b,0)/prior.length:null;
 const sd=prior.length>=30?Math.sqrt(prior.reduce((s,v)=>s+(v-mean)**2,0)/(prior.length-1)):null;
 return {...m,z:sd>0&&Number.isFinite(m.change)?(m.change-mean)/sd:null};
}
function inReactionWindow(t,date,previousDate){
 if(!Number.isFinite(Date.parse(t)))return false;
 const d=day(t),hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',hourCycle:'h23'}).format(new Date(t)));
 if(d===date)return hour<16;
 if(!previousDate)return false;
 return d>previousDate&&d<date||d===previousDate&&hour>=16;
}
export function buildSignalReport({assets=[],bars={},news={},events=[],date}={}){
 const latest=bars.SPY?.at(-1)?.t;const asOf=date||(latest?day(latest):null);
 if(!asOf)return {date:null,drivers:[],sectors:[],stocks:[],status:'missing_data'};
 const rows=Object.fromEntries(Object.entries(bars).map(([s,b])=>[s,b.filter(v=>day(v.t)<=asOf).sort((a,b)=>Date.parse(a.t)-Date.parse(b.t))]));
 const metrics=Object.fromEntries(Object.entries(rows).map(([s,b])=>[s,movement(b)]));
 const valid=s=>metrics[s]?.date===asOf&&Number.isFinite(metrics[s]?.change);
 const drivers=Object.entries(proxies).map(([symbol,label])=>{const m=valid(symbol)?metrics[symbol]:null;return {symbol,label,change:m?.change??null,z:m?.z??null,active:!!m&&(Math.abs(m.change)>=1||Math.abs(m.z??0)>=1.5)}});
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
  return {name,symbol,change:m?.change??null,relative,coverage,covered:covered.length,total:members.length,breadth:covered.length?covered.filter(a=>metrics[a.symbol].change>0).length/covered.length:null,candidates:reactions,active:coverage>=0.6&&!!m&&(Math.abs(relative??0)>=0.5||Math.abs(m.z??0)>=1.5||reactions.length>0)};
 });
 const stocks=assets.filter(a=>a.kind==='stock'&&valid(a.symbol)).flatMap(a=>{
  const m=metrics[a.symbol],sector=sectors.find(s=>s.name===a.sector),relative=sector?.change!=null?m.change-sector.change:null;
  const reasons=[];
  if(Math.abs(m.change)>=1&&Math.abs(m.z??0)>=2)reasons.push('평소 변동 대비 2σ 이상');
  if(Math.abs(m.change)>=1&&(m.volumeRatio??0)>=2)reasons.push('거래량 20일 평균의 2배 이상');
  if(Math.abs(m.change)>=1&&relative!=null&&Math.abs(relative)>=1.5)reasons.push('섹터 대비 1.5%p 이상 차이');
  if(!reasons.length)return [];
  const evidence=(news[a.symbol]||[]).filter(n=>inReactionWindow(n.publishedAt,asOf,rows[a.symbol]?.at(-2)?.t?day(rows[a.symbol].at(-2).t):null));
  const candidates=sector?.candidates.filter(d=>Math.sign(d.beta*d.change)===Math.sign(m.change))||[];
  const score=Math.min(Math.abs(m.z??0),5)*10+Math.min(m.volumeRatio??0,5)*5+Math.min(Math.abs(relative??0),5)*5;
  return [{...a,...m,spark:(rows[a.symbol]||[]).slice(-30).map(v=>Math.round(v.c*100)/100),relativeToSector:relative,reasons,score,candidates,evidence,state:evidence.length?'관련 근거 있음 · 인과 미확정':candidates.length?'Driver 영향 후보 · 인과 미확정':'변화 감지 · 원인 미확인'}];
 }).sort((a,b)=>b.score-a.score||a.symbol.localeCompare(b.symbol));
 const report={date:asOf,status:valid('SPY')?'ok':'missing_benchmark',drivers,sectors,stocks,events:events.filter(e=>inReactionWindow(e.publishedAt,asOf,rows.SPY?.at(-2)?.t?day(rows.SPY.at(-2).t):null)),coverage:assets.filter(a=>a.kind==='stock'&&valid(a.symbol)).length,total:assets.filter(a=>a.kind==='stock').length,method:'rules-v2; driver-aligned candidates, not proven causation or trading recommendations'};
 const windowNews=Object.fromEntries(assets.filter(a=>a.kind==='stock'&&valid(a.symbol)).map(a=>[a.symbol,(news[a.symbol]||[]).filter(e=>inReactionWindow(e.publishedAt,asOf,rows[a.symbol]?.at(-2)?.t?day(rows[a.symbol].at(-2).t):null))]));
 report.thesis=buildDriverThesis({report,rows,windowNews});
 return report;
}
