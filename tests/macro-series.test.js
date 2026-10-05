import test from 'node:test';
import assert from 'node:assert/strict';
import {macroSeries,macroSignal,fredTime} from '../server/macro-series.js';
const days=n=>Array.from({length:n},(_,i)=>new Date(Date.UTC(2026,5,1)+i*864e5).toISOString().slice(0,10));
test('daily series is active on a large same-day move',()=>{
 const s=macroSeries.find(x=>x.id==='DGS10'),d=days(130);
 const obs=d.map((day,i)=>({d:day,v:4+Math.sin(i)*0.01+(i===129?0.2:0)}));
 const sig=macroSignal(s,{observations:obs},d.at(-1),()=>false);
 assert.equal(sig.released,true);assert.ok(sig.z>1.5);assert.equal(sig.active,true);
 assert.equal(macroSignal(s,{observations:obs},d.at(-2),()=>false).active,false);
});
test('monthly series counts only when released inside the reaction window',()=>{
 const s=macroSeries.find(x=>x.id==='CPIAUCSL'),obs=Array.from({length:30},(_,i)=>({d:`20${24+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}-01`,v:300+i}));
 assert.equal(macroSignal(s,{observations:obs,lastUpdated:'2026-10-02T08:30:00-04:00'},'2026-10-02',()=>true).active,true);
 assert.equal(macroSignal(s,{observations:obs,lastUpdated:'2026-09-02T08:30:00-04:00'},'2026-10-02',()=>false).active,false);
});
test('FRED timestamps parse to ISO offsets',()=>{assert.equal(fredTime('2026-10-02 07:51:03-05'),'2026-10-02T07:51:03-05:00');assert.equal(fredTime('bad'),null)});
