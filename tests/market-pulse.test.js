import test from 'node:test';
import assert from 'node:assert/strict';
import {groupScores,detectPattern,buildPulse,appendPulse,dailySigma,level} from '../server/market-pulse.js';

const m=(change,sigma=1)=>({change,sigma});
test('risk-off when stocks fall, haven assets and fear rise', ()=>{
 const z=groupScores({SPY:m(-1.5),QQQ:m(-2),IWM:m(-1.8),GLD:m(1.2),UUP:m(0.8),FXY:m(1),VIXY:m(3),HYG:m(-1),'BTC/USD':m(-1.5)});
 assert.equal(detectPattern(z).id,'risk_off');
});
test('rates group flips the bond ETF sign', ()=>{
 const z=groupScores({TLT:m(-1),IEF:m(-1)});
 assert.ok(z.rates>0);
});
test('inflation scare when oil and rates rise while stocks fall', ()=>{
 const z=groupScores({USO:m(2),TLT:m(-1.2),IEF:m(-1),SPY:m(-1),QQQ:m(-1.2),IWM:m(-0.8),GLD:m(0.1),VIXY:m(0.2)});
 assert.equal(detectPattern(z).id,'inflation');
});
test('calm and unknown states', ()=>{
 const z=groupScores({SPY:m(0.1),TLT:m(0.1),USO:m(-0.2),DBC:m(0.1),GLD:m(0),HYG:m(0.1),VIXY:m(-0.1)});
 assert.equal(detectPattern(z).id,'calm');
 assert.equal(detectPattern(groupScores({SPY:m(1)})).id,'unknown');
});
test('public pulse carries levels only and history de-duplicates by time', ()=>{
 const p=buildPulse({moves:{SPY:m(2),QQQ:m(2),IWM:m(2)},at:new Date('2026-10-06T16:20:00Z')});
 assert.equal(p.groups.stocks,2);assert.equal(p.session,'regular');
 assert.ok(!JSON.stringify(p).includes('change'));
 const h=appendPulse(appendPulse({items:[]},p),p);assert.equal(h.items.length,1);
});
test('sigma and level thresholds', ()=>{
 assert.equal(dailySigma([1,2]),null);
 assert.ok(dailySigma(Array.from({length:30},(_,i)=>100+(i%2)))>0);
 assert.deepEqual([level(1.6),level(0.6),level(0),level(-0.6),level(-2)],[2,1,0,-1,-2]);
});
test('overnight day-market session boundaries', async ()=>{
 const {etSession}=await import('../server/market-pulse.js');
 assert.equal(etSession(new Date('2026-10-07T05:30:00Z')),'overnight'); // Wed 01:30 ET
 assert.equal(etSession(new Date('2026-10-07T01:00:00Z')),'overnight'); // Tue 21:00 ET
 assert.equal(etSession(new Date('2026-10-10T01:00:00Z')),'closed');    // Fri 21:00 ET
 assert.equal(etSession(new Date('2026-10-12T01:00:00Z')),'overnight'); // Sun 21:00 ET
 assert.equal(etSession(new Date('2026-10-10T15:00:00Z')),'closed');    // Sat
});
