import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshot,evaluate,summarize} from '../server/validation.js';
const funnel={favored:['Energy'],sectors:[{id:'Energy',verdict:'유리',confirmed:true}],picks:[{symbol:'XOM',sector:'Energy',basis:'거래 집중'},{symbol:'CVX',sector:'Energy',basis:'리포트 근거'}]};
const days=['2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09','2026-10-12','2026-10-13'];
const series=f=>days.map((d,i)=>({d,c:f(i)}));
test('snapshot, scoring at 1 and 5 trading days, summary', ()=>{
 const r=snapshot(funnel,'2026-10-05');assert.equal(r.favored[0].etf,'XLE');
 const closes={SPY:series(i=>100+i),XLE:series(i=>100+2*i),XOM:series(i=>100+3*i),CVX:series(i=>100+i)};
 evaluate(r,closes);assert.equal(r.outcomes[1].favored[0].beat,true);assert.equal(r.outcomes[5].until,'2026-10-12');
 assert.deepEqual(r.outcomes[5].picks.map(p=>[p.symbol,p.beat]),[['XOM',true],['CVX',false]]);
 const s=summarize([r],5);assert.deepEqual(s.sectors,{hit:1,n:1});assert.deepEqual(s.byBasis['거래 집중'],{hit:1,n:1});assert.deepEqual(s.byBasis['리포트 근거'],{hit:0,n:1});
 assert.ok(!JSON.stringify(r).match(/"c":/));
});
