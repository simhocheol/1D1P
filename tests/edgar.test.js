import test from 'node:test';
import assert from 'node:assert/strict';
import {edgarTime,filingEvidence} from '../server/edgar.js';
import {buildSignalReport} from '../server/signal-engine.js';
test('EDGAR acceptance time is Eastern wall time',()=>{
 assert.equal(edgarTime('2026-10-01T20:15:15.000Z'),'2026-10-02T00:15:15.000Z');
 assert.equal(edgarTime('2026-12-01T16:05:00.000Z'),'2026-12-01T21:05:00.000Z');
});
test('8-K items and offering forms map to Drivers; structured notes are ignored',()=>{
 const ev=filingEvidence({symbol:'NKE',form:'8-K',items:['2.02','2.05','9.01'],url:'https://www.sec.gov/x',acceptedAt:'2026-10-02T00:15:15.000Z'});
 assert.deepEqual(ev.map(e=>e.driver).sort(),['margin','margin','revenue']);
 assert.equal(filingEvidence({symbol:'JPM',form:'424B2',items:[]}).length,0);
 assert.deepEqual(filingEvidence({symbol:'X',form:'424B5',items:[]}).map(e=>e.driver),['capital']);
});
test('a filing in the reaction window creates a company path for an abnormal mover',()=>{
 const bars=move=>{let c=100;return Array.from({length:65},(_,i)=>{c*=1+(i===64?move:Math.sin(i)*.003);return {t:new Date(Date.UTC(2026,0,i+1,14)).toISOString(),o:c,h:c,l:c,c,v:i===64&&move?300:100}})};
 const r=buildSignalReport({assets:[{symbol:'AAA',name:'Test',kind:'stock',sector:'Information Technology'}],bars:{AAA:bars(-.05),SPY:bars(.002),XLK:bars(.001),TLT:bars(0),USO:bars(0),QQQ:bars(0),GLD:bars(0)},filings:{filings:[{symbol:'AAA',form:'8-K',items:['2.02'],acceptedAt:'2026-03-06T15:30:00.000Z',url:'https://www.sec.gov/a'}]}});
 const c=r.thesis.candidates.find(x=>x.symbol==='AAA');
 assert.ok(c.paths.some(p=>p.driverId==='margin'&&p.basis.includes('SEC')));
 assert.equal(r.thesis.drivers.find(d=>d.id==='revenue').status,'observed');
});
