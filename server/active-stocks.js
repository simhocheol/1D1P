// "Where trading is crowding": S&P 500 stocks with unusually high 5-minute volume and buy-side trade strength.
// Inputs are private (bars, trades); public output is stages only (no prices, volumes or ratios).
const etParts=t=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(t)).map(p=>[p.type,p.value]));
export const etSlot=t=>{const p=etParts(t);return `${p.hour}:${p.minute}`};
export const etDate=t=>{const p=etParts(t);return `${p.year}-${p.month}-${p.day}`};
const regular=t=>{const p=etParts(t),m=+p.hour*60+ +p.minute;return m>=570&&m<960};
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
// bars: 5-minute bars [{t,o,c,v,vw}] oldest first, ending with the bar being judged.
export function barMetrics(bars){
 const last=bars.at(-1);if(!last||!regular(last.t))return null;
 const slot=etSlot(last.t),day=etDate(last.t);
 const same=bars.filter(b=>etSlot(b.t)===slot&&etDate(b.t)!==day).slice(-20).map(b=>b.v).filter(v=>v>0);
 if(same.length<10||!(last.o>0))return null;
 // VWAP: cumulative over today's regular session up to the judged bar.
 const today=bars.filter(b=>etDate(b.t)===day&&regular(b.t));const vol=today.reduce((s,b)=>s+b.v,0);
 const vwap=vol>0?today.reduce((s,b)=>s+(b.vw||b.c)*b.v,0)/vol:null;
 return {at:last.t,ratio:last.v/mean(same),change:(last.c/last.o-1)*100,aboveVwap:vwap?last.c>=vwap:null};
}
// Tick rule: a trade above the previous different price is buyer-initiated, below is seller-initiated.
export function tradeStrength(trades){
 let buy=0,sell=0,prev=null,side=0;
 for(const t of trades){if(prev!=null&&t.p!==prev)side=t.p>prev?1:-1;if(side>0)buy+=t.s;else if(side<0)sell+=t.s;prev=t.p}
 return sell>0?buy/sell*100:buy>0?999:null;
}
export const volStage=r=>r>=5?'평소의 5배 이상':r>=3?'평소의 3배 이상':r>=2?'평소의 2배 이상':'평소의 1.5배 이상';
export const strengthStage=s=>s>=200?'매수 우위 매우 강함':s>=150?'매수 우위 강함':'매수 우위';
export function rankActive(rows,n=5){
 return rows.filter(r=>r&&r.ratio>=1.5&&r.strength>=110).map(r=>({...r,score:Math.log2(r.ratio)+(Math.min(r.strength,400)-100)/100}))
  .sort((a,b)=>b.score-a.score).slice(0,n)
  .map(r=>({symbol:r.symbol,name:r.name,sector:r.sector,volume:volStage(r.ratio),strength:strengthStage(r.strength),dir:r.change>0.05?'up':r.change<-0.05?'down':'flat',vwap:r.aboveVwap==null?null:r.aboveVwap?'above':'below'}));
}
