import test from 'node:test';
import assert from 'node:assert/strict';
import {validateClassification,htmlToText,responseSchema} from '../server/classify.js';
import {buildSignalReport} from '../server/signal-engine.js';
const items=[{id:'a',text:'NIKE reported revenue fell 9% to $11.2 billion as tariffs weighed on gross margin.'}];
test('only quotes present in the source survive validation',()=>{
 const out=validateClassification(items,{items:[{id:'a',drivers:[
  {driverId:'revenue',direction:-1,quote:'revenue fell 9% to $11.2 billion',confidence:.9},
  {driverId:'margin',direction:-1,quote:'margins collapsed to record lows',confidence:.9},
  {driverId:'policy',direction:-1,quote:'tariffs weighed on gross margin',confidence:.3},
  {driverId:'bogus',direction:1,quote:'NIKE reported revenue',confidence:.9}]},{id:'unknown',drivers:[]}]});
 assert.deepEqual(Object.keys(out),['a']);assert.deepEqual(out.a.map(d=>d.driverId),['revenue']);
});
test('html is reduced to text and the schema is strict',()=>{
 assert.equal(htmlToText('<p>Sales&nbsp;<b>rose</b></p><script>x()</script>'),'Sales rose');
 assert.equal(responseSchema.strict,true);
});
test('classified filing direction confirms or rejects a company path',()=>{
 const bars=move=>{let c=100;return Array.from({length:65},(_,i)=>{c*=1+(i===64?move:Math.sin(i)*.003);return {t:new Date(Date.UTC(2026,0,i+1,14)).toISOString(),o:c,h:c,l:c,c,v:i===64&&move?300:100}})};
 const base={assets:[{symbol:'AAA',name:'Test',kind:'stock',sector:'Information Technology'}],bars:{AAA:bars(-.05),SPY:bars(.002),XLK:bars(.001),TLT:bars(0),USO:bars(0),QQQ:bars(0),GLD:bars(0)},filings:{filings:[{symbol:'AAA',form:'8-K',items:['2.02'],acceptedAt:'2026-03-05T21:30:00.000Z',url:'https://www.sec.gov/a'}]}};
 const tag=dir=>({checked:['https://www.sec.gov/a'],items:{'https://www.sec.gov/a':[{driverId:'margin',direction:dir,quote:'gross margin declined 300 basis points',confidence:.9}]}});
 const same=buildSignalReport({...base,classified:tag(-1)}).thesis.candidates.find(c=>c.symbol==='AAA');
 assert.ok(same.paths.some(p=>p.driverId==='margin'&&p.basis==='SEC 공시 원문 분류·가격 방향 일치'));
 const opposite=buildSignalReport({...base,classified:tag(1)}).thesis.candidates.find(c=>c.symbol==='AAA');
 assert.ok(!opposite?.paths.some(p=>p.driverId==='margin'));
});
