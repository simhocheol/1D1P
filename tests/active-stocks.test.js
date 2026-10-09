import test from 'node:test';
import assert from 'node:assert/strict';
import {barMetrics,tradeStrength,rankActive,etSlot} from '../server/active-stocks.js';
// 20 prior days of a 10:30 ET bar (14:30Z in October) plus today's session bars.
function bars(lastV){const out=[];for(let d=1;d<=20;d++)out.push({t:`2026-09-${String(d).padStart(2,'0')}T14:30:00Z`,o:100,c:100,v:1000,vw:100});
 out.push({t:'2026-10-09T14:25:00Z',o:100,c:100,v:1000,vw:99},{t:'2026-10-09T14:30:00Z',o:100,c:101,v:lastV,vw:100.5});return out}
test('5-minute ratio against the same slot, VWAP side', ()=>{
 assert.equal(etSlot('2026-10-09T14:30:00Z'),'10:30');
 const m=barMetrics(bars(4000));assert.ok(Math.abs(m.ratio-4)<1e-9);assert.ok(m.change>0);assert.equal(m.aboveVwap,true);
 assert.equal(barMetrics([{t:'2026-10-09T02:00:00Z',o:1,c:1,v:1}]),null);
});
test('tick-rule strength and ranking keep stages only', ()=>{
 assert.ok(tradeStrength([{p:10,s:1},{p:10.1,s:300},{p:10.1,s:100},{p:10,s:100}])>350);
 const items=rankActive([{symbol:'AAA',name:'A',sector:'X',ratio:4,strength:180,change:0.4,aboveVwap:true},{symbol:'BBB',ratio:1.2,strength:300},{symbol:'CCC',ratio:3,strength:95}]);
 assert.equal(items.length,1);assert.deepEqual(Object.keys(items[0]).sort(),['dir','name','sector','strength','symbol','volume','vwap']);
 assert.equal(items[0].volume,'평소의 3배 이상');
});
