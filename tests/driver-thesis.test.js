import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSignalReport} from '../server/signal-engine.js';
const make=(move=0,phase=0)=>{let c=100;return Array.from({length:65},(_,i)=>{c*=1+(i===64?move:Math.sin(i+phase)*.003);return {t:new Date(Date.UTC(2026,0,i+1,14)).toISOString(),c,v:i===64&&move?300:100}})};
const assets=[{symbol:'AAA',name:'Acme, Inc.',kind:'stock',sector:'Information Technology'},{symbol:'BBB',name:'Beta Corp.',kind:'stock',sector:'Information Technology'}];
const bars={AAA:make(.04),BBB:make(0),SPY:make(0),XLK:make(.01)};
const article=title=>({title,url:'https://example.com/article',publishedAt:'2026-03-06T15:00:00Z',source:'Test'});
test('price anomalies alone are not Driver-aligned candidates; unknown is not quiet',()=>{
 const {thesis}=buildSignalReport({assets,bars});
 assert.equal(thesis.candidates.length,0);assert.equal(thesis.unexplainedCount,1);
 assert.equal(thesis.drivers.length,12);assert.equal(thesis.drivers.find(d=>d.id==='fx').status,'unknown');
 assert.equal(thesis.sectors.length,0);
});
test('a proxy needs both sector and individual historical exposure, excluding current day',()=>{
 const {thesis}=buildSignalReport({assets,bars:{...bars,TLT:make(.02)}});
 assert.equal(thesis.candidates[0].symbol,'AAA');
 const path=thesis.candidates[0].paths[0];assert.equal(path.driverId,'rates');assert.equal(path.exposure.samples,60);
 assert.equal(path.scope,'sector');assert.ok(path.exposure.correlation>.99);
 const independent=buildSignalReport({assets,bars:{...bars,AAA:make(.04,Math.PI/2),TLT:make(.02)}});
 assert.equal(independent.thesis.candidates.length,0);
 const opposite=buildSignalReport({assets,bars:{...bars,AAA:make(-.04),TLT:make(.02)}});
 assert.equal(opposite.thesis.candidates.length,0);
});
test('direct company event uses matched subject and direction; does not assert sector-wide effect',()=>{
 const {thesis}=buildSignalReport({assets,bars,news:{AAA:[article('Acme raises revenue guidance')]}});
 assert.equal(thesis.candidates[0].paths[0].driverId,'revenue');
 assert.equal(thesis.candidates[0].paths[0].scope,'company');
 assert.deepEqual(thesis.sectors[0].sectorDriverIds,[]);
 assert.deepEqual(thesis.sectors[0].companyDriverIds,['revenue']);
});
test('wrong company, speculation, price-only headlines and opposing fundamental directions cannot qualify',()=>{
 for(const titles of [['Beta raises revenue guidance; Acme shares rise'],['Acme may raise revenue guidance'],['AAA shares rise 4%'],['AAA cuts revenue guidance'],['AAA raises revenue guidance','AAA cuts revenue guidance'],['Acme expects revenue beats']]){
  assert.equal(buildSignalReport({assets,bars,news:{AAA:titles.map(article)}}).thesis.candidates.length,0,titles.join(' / '));
 }
});
test('official policy topics are observed but do not invent sector direction or stock candidates',()=>{
 const {thesis}=buildSignalReport({assets,bars,events:[article('Federal Reserve announces enforcement action')]});
 assert.equal(thesis.drivers.find(d=>d.id==='policy').status,'observed');
 assert.equal(thesis.drivers.find(d=>d.id==='rates').status,'unknown');
 assert.equal(thesis.candidates.length,0);assert.equal(thesis.sectors.length,0);
});
test('future news and weak sector coverage cannot create proxy candidates',()=>{
 const news={AAA:[{...article('AAA raises revenue guidance'),publishedAt:'2026-03-06T22:00:00Z'}]};
 assert.equal(buildSignalReport({assets,bars,news}).thesis.candidates.length,0);
 const sparse={...bars,BBB:make(0).slice(0,-1),TLT:make(.02)};
 assert.equal(buildSignalReport({assets,bars:sparse}).thesis.candidates.length,0);
});
test('correlation without a predefined economic transmission path does not qualify',()=>{
 const {thesis}=buildSignalReport({assets,bars:{...bars,USO:make(.03)}});
 assert.equal(thesis.candidates.length,0);assert.equal(thesis.sectors.length,0);
 assert.equal(thesis.drivers.find(d=>d.id==='cost').status,'observed');
});
