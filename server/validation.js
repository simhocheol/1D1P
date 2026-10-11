// Validation log for the funnel: what was favored / watched each day, and whether it beat its benchmark
// 1 and 5 trading days later (favored sector ETF vs SPY, watched stock vs its sector ETF).
// Public output keeps only hit / miss, never returns or prices.
import {sectors} from './sector-flow.js';
const etfOf=Object.fromEntries(sectors.map(s=>[s.id,s.etf]));
export const HORIZONS=[1,5];
export function snapshot(funnel,date){
 return {date,favored:(funnel.favored||[]).map(id=>{const s=funnel.sectors?.find(x=>x.id===id);return {id,etf:etfOf[id],verdict:s?.verdict||null,confirmed:!!s?.confirmed}}),
  picks:(funnel.picks||[]).map(p=>({symbol:p.symbol,sector:p.sector,etf:etfOf[p.sector],basis:p.basis})),outcomes:{}};
}
// closes: {SYMBOL:[{d:'YYYY-MM-DD',c}]} oldest first. Trading days follow SPY's calendar.
export function evaluate(rec,closes){
 const spy=closes.SPY||[];const i0=spy.findLastIndex(x=>x.d<=rec.date);if(i0<0)return rec;
 const ret=(sym,a,b)=>{const c=closes[sym];if(!c)return null;const x=c.findLast(o=>o.d<=a),y=c.findLast(o=>o.d<=b);return x&&y&&x.c>0?y.c/x.c-1:null};
 for(const h of HORIZONS){if(rec.outcomes[h]||!spy[i0+h])continue;const a=spy[i0].d,b=spy[i0+h].d,m=ret('SPY',a,b);
  const fav=rec.favored.map(f=>{const r=ret(f.etf,a,b);return r==null||m==null?null:{id:f.id,beat:r>m}}).filter(Boolean);
  const picks=rec.picks.map(p=>{const r=ret(p.symbol,a,b),s=ret(p.etf,a,b);return r==null||s==null?null:{symbol:p.symbol,beat:r>s}}).filter(Boolean);
  rec.outcomes[h]={until:b,favored:fav,picks};}
 return rec;
}
const tally=a=>({hit:a.filter(x=>x.beat).length,n:a.length});
export function summarize(records,h=5,last=30){
 const done=records.filter(r=>r.outcomes?.[h]).slice(-last);const fav=done.flatMap(r=>r.outcomes[h].favored.map(o=>({...o,confirmed:r.favored.find(f=>f.id===o.id)?.confirmed})));
 const picks=done.flatMap(r=>r.outcomes[h].picks.map(o=>({...o,basis:r.picks.find(p=>p.symbol===o.symbol)?.basis})));
 return {horizon:h,days:done.length,sectors:tally(fav),confirmed:tally(fav.filter(x=>x.confirmed)),picks:tally(picks),byBasis:{'거래 집중':tally(picks.filter(p=>p.basis==='거래 집중')),'리포트 근거':tally(picks.filter(p=>p.basis==='리포트 근거'))}};
}
