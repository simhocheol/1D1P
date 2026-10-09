// Macro → sector → volume → stock funnel. Public output carries stages and reasons only.
export const sectors=[
 {id:'Information Technology',name:'정보기술',etf:'XLK'},{id:'Financials',name:'금융',etf:'XLF'},{id:'Energy',name:'에너지',etf:'XLE'},
 {id:'Health Care',name:'헬스케어',etf:'XLV'},{id:'Consumer Discretionary',name:'경기소비재',etf:'XLY'},{id:'Consumer Staples',name:'필수소비재',etf:'XLP'},
 {id:'Industrials',name:'산업재',etf:'XLI'},{id:'Materials',name:'소재',etf:'XLB'},{id:'Utilities',name:'유틸리티',etf:'XLU'},
 {id:'Real Estate',name:'부동산',etf:'XLRE'},{id:'Communication Services',name:'커뮤니케이션',etf:'XLC'},
];
const S=Object.fromEntries(sectors.map(s=>[s.name,s.id]));
// Rules: when an indicator is in a state, which sectors tend to benefit (+) or suffer (−), and why.
// Positions come from the long-run context (percentile ≥70 high, ≤30 low); directions from economic direction.
export const macroRules=[
 {when:{level:'rate10',state:'high'},why:'금리가 높아 예대마진이 커지고, 빚이 많은 업종은 이자 부담이 커요',plus:['금융'],minus:['부동산','유틸리티']},
 {when:{level:'real10',state:'high'},why:'실질 금리가 높아 먼 미래 이익의 가치가 낮아져요',plus:['금융'],minus:['정보기술','커뮤니케이션','부동산']},
 {when:{level:'real10',state:'low'},why:'실질 금리가 낮아 성장 기업의 미래 이익이 높게 평가돼요',plus:['정보기술','커뮤니케이션'],minus:[]},
 {when:{level:'curve',state:'low'},why:'장단기 금리차가 작아 경기 둔화 걱정이 커요',plus:['필수소비재','헬스케어','유틸리티'],minus:['경기소비재','산업재']},
 {when:{level:'curve',state:'high'},why:'장단기 금리차가 넓어 은행 수익과 경기 기대가 커요',plus:['금융','산업재'],minus:[]},
 {when:{level:'breakeven',state:'high'},why:'물가가 오를 거라 예상돼 원자재 가격이 받쳐져요',plus:['에너지','소재'],minus:['필수소비재']},
 {when:{level:'cpi',state:'high'},why:'물가가 높아 가격을 올릴 수 있는 업종이 버티고, 소비 여력은 줄어요',plus:['에너지','소재'],minus:['경기소비재']},
 {when:{level:'dollar',state:'high'},why:'달러가 강해 해외 매출이 큰 기업의 실적이 줄어 보여요',plus:['유틸리티','부동산'],minus:['정보기술','소재']},
 {when:{level:'dollar',state:'low'},why:'달러가 약해 해외 매출이 큰 기업과 원자재가 유리해요',plus:['정보기술','소재'],minus:[]},
 {when:{level:'vix',state:'high'},why:'시장이 불안해 경기를 덜 타는 업종으로 돈이 피해요',plus:['필수소비재','유틸리티','헬스케어'],minus:['정보기술','경기소비재']},
 {when:{level:'vix',state:'low'},why:'시장이 차분해 성장·경기 민감 업종에 돈이 가요',plus:['정보기술','경기소비재'],minus:[]},
 {when:{level:'unemp',state:'low'},why:'일자리가 튼튼해 소비가 받쳐져요',plus:['경기소비재','산업재'],minus:[]},
 {when:{dir:'retail',state:'up'},why:'소매판매가 늘고 있어요',plus:['경기소비재'],minus:[]},
 {when:{dir:'industry',state:'up'},why:'산업생산이 늘고 있어요',plus:['산업재','소재'],minus:[]},
 {when:{dir:'permits',state:'up'},why:'주택 건축 허가가 늘고 있어요',plus:['부동산','소재'],minus:[]},
 {when:{dir:'claims',state:'down'},why:'실업수당 신청이 늘어 고용이 식고 있어요',plus:['필수소비재','헬스케어'],minus:['경기소비재']},
 {when:{dir:'payrolls',state:'down'},why:'일자리 증가 속도가 느려지고 있어요',plus:['필수소비재','헬스케어'],minus:['산업재']},
];
const pos=p=>p==null?null:p>=70?'high':p<=30?'low':'mid';
export function macroSectorScores(context){
 const items=Object.fromEntries((context?.items||[]).map(i=>[i.id,i])),dirs=Object.fromEntries((context?.direction?.items||[]).map(i=>[i.id,i]));
 const out=Object.fromEntries(sectors.map(s=>[s.id,{score:0,plus:[],minus:[]}]));
 for(const r of macroRules){
  const hit=r.when.level?pos(items[r.when.level]?.percentile)===r.when.state:dirs[r.when.dir]?.trend===r.when.state;if(!hit)continue;
  for(const n of r.plus){out[S[n]].score++;out[S[n]].plus.push(r.why)}for(const n of r.minus){out[S[n]].score--;out[S[n]].minus.push(r.why)}
 }
 return out;
}
// Regime in a few words, from the same context.
export function regimeLine(context){
 const items=Object.fromEntries((context?.items||[]).map(i=>[i.id,i]));const parts=[];
 if(pos(items.rate10?.percentile)==='high')parts.push('고금리');else if(pos(items.rate10?.percentile)==='low')parts.push('저금리');
 if(pos(items.dollar?.percentile)==='high')parts.push('강달러');else if(pos(items.dollar?.percentile)==='low')parts.push('약달러');
 if(pos(items.cpi?.percentile)==='high')parts.push('물가 부담');
 if(items.curve?.value<0)parts.push('금리 역전');
 const d=context?.direction?.items||[],up=d.filter(x=>x.trend==='up').length,down=d.filter(x=>x.trend==='down').length;
 parts.push(up>=down+2?'경기 개선 중':down>=up+2?'경기 둔화 중':'경기 엇갈림');
 if(pos(items.vix?.percentile)==='high')parts.push('불안 고조');
 return parts;
}
// Relative strength vs SPY over 5 and 21 trading days, from daily closes (oldest first).
export function relStrength(closes,spy,days){if(closes.length<=days||spy.length<=days)return null;const r=a=>(a.at(-1)/a.at(-1-days)-1)*100;return r(closes)-r(spy)}
export const rsStage=v=>v==null?null:v>=2?'strong':v>=0.5?'up':v<=-2?'weak':v<=-0.5?'down':'flat';
export const rsText={strong:'시장보다 강함',up:'시장보다 약간 강함',flat:'시장과 비슷',down:'시장보다 약간 약함',weak:'시장보다 약함'};
const rsPoint={strong:2,up:1,flat:0,down:-1,weak:-2};
// Final verdict: macro score plus what the money is actually doing (1-month strength and the last hour's flow).
export function sectorVerdict({macro,rs1w,rs1m,flow}){
 const measured=(rsPoint[rsStage(rs1m)]??0)+(rsPoint[rsStage(rs1w)]??0)/2+(flow?.dir==='in'?1:flow?.dir==='out'?-1:0);
 const total=Math.sign(macro.score)*Math.min(Math.abs(macro.score),3)+measured;
 const confirmed=macro.score>0&&measured>0;
 return {total:Math.round(total*10)/10,verdict:total>=2?'유리':total<=-2?'불리':'중립',confirmed};
}
// Funnel picks: active stocks inside favored sectors first, then daily-report candidates there.
export function pickStocks({favored,active,candidates,n=5}){
 const fav=new Set(favored.map(f=>f.id));const out=[],seen=new Set();
 for(const a of active.filter(a=>fav.has(a.sector))){if(out.length>=n)break;out.push({...a,basis:'거래 집중'});seen.add(a.symbol)}
 for(const c of (candidates||[]).filter(c=>fav.has(c.sector)&&!seen.has(c.symbol))){if(out.length>=n)break;out.push({symbol:c.symbol,name:c.name,sector:c.sector,basis:'리포트 근거',drivers:c.drivers||[]});seen.add(c.symbol)}
 return out;
}
