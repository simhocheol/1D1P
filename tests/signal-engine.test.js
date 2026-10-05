import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSignalReport} from '../server/signal-engine.js';
const make=(move=0)=>{let c=100;return Array.from({length:65},(_,i)=>{c*=1+(i===64?move:Math.sin(i)*0.003);return {t:new Date(Date.UTC(2026,0,i+1,14)).toISOString(),c,v:i===64&&move?300:100}})};
const assets=[{symbol:'AAA',kind:'stock',sector:'Information Technology'},{symbol:'BBB',kind:'stock',sector:'Information Technology'}];
test('selects only unusual moves and retains explicit selection reasons',()=>{
 const report=buildSignalReport({assets,bars:{AAA:make(.04),BBB:make(0),SPY:make(0),XLK:make(.01)}});
 assert.deepEqual(report.stocks.map(s=>s.symbol),['AAA']);assert.ok(report.stocks[0].reasons.length>=2);assert.equal(report.coverage,2);
});
test('unknown and stale data are not scored as zero or selected',()=>{
 const report=buildSignalReport({assets,bars:{AAA:make(.04).slice(0,-1),SPY:make(0),XLK:make(.01)}});
 assert.equal(report.stocks.length,0);assert.equal(report.coverage,0);assert.equal(report.sectors.find(s=>s.symbol==='XLK').active,false);
});
test('historical selection excludes future moves and after-close news',()=>{
 const bars={AAA:make(.04),BBB:make(0),SPY:make(0),XLK:make(.01)};
 const date='2026-03-06';
 const report=buildSignalReport({assets,bars,news:{AAA:[{publishedAt:date+'T15:00:00Z',title:'during'},{publishedAt:'2026-03-05T23:00:00Z',title:'previous-close'},{publishedAt:date+'T23:00:00Z',title:'after'}]}});
 assert.equal(report.date,date);assert.deepEqual(report.stocks[0].evidence.map(e=>e.title),['during']);
 const old=buildSignalReport({assets,bars,date:'2026-03-05'});assert.equal(old.stocks.length,0);
});
test('no benchmark or bars does not manufacture sector influence',()=>{const r=buildSignalReport({assets});assert.equal(r.status,'missing_data');assert.deepEqual(r.stocks,[])});
