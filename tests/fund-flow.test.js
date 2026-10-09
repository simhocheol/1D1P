import test from 'node:test';
import assert from 'node:assert/strict';
import {symbolFlow,classFlow,flowClasses,flowSummary} from '../server/fund-flow.js';
// 30 days of hourly bars at 14:00 UTC plus filler hours; the last bar is the one judged.
function bars({lastV,lastMove,tb}){const out=[];for(let d=1;d<=25;d++)for(const h of [13,14]){const t=new Date(Date.UTC(2026,8,d,h)).toISOString();out.push({t,o:100,c:100+(h===13?0.1:-0.1),v:1000,tb:500})}
 out.push({t:new Date(Date.UTC(2026,8,26,14)).toISOString(),o:100,c:100+lastMove,v:lastV,tb});return out}
test('volume ratio, direction and taker strength', ()=>{
 const s=symbolFlow(bars({lastV:2500,lastMove:0.5,tb:1600}));
 assert.ok(s.ratio>2.4&&s.z>0.5&&s.strength>170);
 assert.equal(symbolFlow([]),null);
});
test('class flow stages and summary', ()=>{
 const cls=flowClasses.find(c=>c.id==='crypto');
 const f=classFlow(cls,{BTCUSDT:symbolFlow(bars({lastV:2500,lastMove:0.5,tb:1600}))});
 assert.equal(f.dir,'in');assert.equal(f.vol,'surge');assert.equal(f.pressure,'buy');assert.equal(f.lead,'비트코인');
 assert.equal(classFlow(flowClasses[0],{}).dir,null);
 const q=classFlow(flowClasses[0],{SPY:symbolFlow(bars({lastV:300,lastMove:0.5}))});assert.equal(q.dir,'flat');assert.equal(q.vol,'quiet');
 assert.ok(flowSummary([f]).includes('가상자산 유입'));assert.ok(!JSON.stringify(f).match(/\d{3,}/));
});
