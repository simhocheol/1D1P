import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSignalReport} from '../server/signal-engine.js';
import {toPublicReport} from '../server/public-report.js';
const bars=move=>{let c=100;return Array.from({length:65},(_,i)=>{c*=1+(i===64?move:Math.sin(i)*.003);return {t:new Date(Date.UTC(2026,0,i+1,14)).toISOString(),o:c,h:c*1.01,l:c*.99,c,v:i===64&&move?300:100}})};
test('public report keeps results and drops prices, headlines, quotes and FRED values',()=>{
 const r=buildSignalReport({assets:[{symbol:'AAA',name:'Test',kind:'stock',sector:'Information Technology'}],bars:{AAA:bars(-.05),SPY:bars(.002),XLK:bars(.001),TLT:bars(0),USO:bars(0),QQQ:bars(0),GLD:bars(0)},
  news:{AAA:[{title:'SECRET HEADLINE',url:'https://news.example/x',publishedAt:'2026-03-06T15:00:00Z'}]},
  filings:{filings:[{symbol:'AAA',form:'8-K',items:['2.02'],acceptedAt:'2026-03-06T15:30:00.000Z',url:'https://www.sec.gov/a'}]},
  classified:{checked:['https://www.sec.gov/a'],items:{'https://www.sec.gov/a':[{driverId:'margin',direction:-1,quote:'SECRET QUOTE',confidence:.9}]}}});
 const pub=toPublicReport(r,'2026-10-05T00:00:00Z'),json=JSON.stringify(pub);
 assert.ok(pub.candidates.some(c=>c.symbol==='AAA'));
 for(const banned of ['SECRET HEADLINE','SECRET QUOTE','"close"','"volume"','"spark"','"chart"','"rsi14"','"correlation"','"value"'])assert.ok(!json.includes(banned),banned);
 assert.ok(pub.drivers.find(d=>d.id==='margin').links.every(l=>l.url.startsWith('https://www.sec.gov/')));
 assert.equal(Math.round(pub.candidates[0].change*10)/10,pub.candidates[0].change);
});
