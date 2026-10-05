import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSignalReport} from '../server/signal-engine.js';
const make=(n=70)=>{let c=100;return Array.from({length:n},(_,i)=>{c*=1+Math.sin(i)*.003;return {t:new Date(Date.UTC(2026,1,1,14)+i*864e5).toISOString(),o:c*.999,h:c*1.01,l:c*.99,c,v:100}})};
const bars={AAA:make(),SPY:make(),XLK:make(),TLT:make(),USO:make(),QQQ:make(),GLD:make()};
const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'});
const prevDay=fmt.format(new Date(bars.SPY.at(-2).t)),asOf=fmt.format(new Date(bars.SPY.at(-1).t));
const cutoff=`${asOf}T13:15:00.000Z`;
const premarket={[asOf]:{cutoff,prices:{AAA:{c:bars.AAA.at(-2).c*1.06},SPY:{c:bars.SPY.at(-2).c*1.002},XLK:{c:bars.XLK.at(-2).c*1.004}}}};
const news={AAA:[{title:'after close',publishedAt:`${prevDay}T21:30:00Z`,url:'https://e.com/1'},{title:'premarket',publishedAt:`${asOf}T12:00:00Z`,url:'https://e.com/2'},{title:'after publish',publishedAt:`${asOf}T14:00:00Z`,url:'https://e.com/3'}]};
const assets=[{symbol:'AAA',name:'A',kind:'stock',sector:'Information Technology'}];
test('pre-market report compares the 09:15 price with the prior close and uses the overnight window',()=>{
 const r=buildSignalReport({assets,bars,news,premarket,session:'pre',date:asOf});
 assert.equal(r.session,'pre');assert.equal(r.cutoff,cutoff);
 const a=r.stocks.find(s=>s.symbol==='AAA');
 assert.ok(Math.abs(a.change-6)<1e-6);
 assert.deepEqual(a.evidence.map(e=>e.title),['after close','premarket']);
 assert.equal(a.intraday,null);
});
test('post-market report uses only 09:15–16:00 evidence and reports the regular-session move',()=>{
 const r=buildSignalReport({assets,bars:{...bars,AAA:bars.AAA.map((b,i,arr)=>i===arr.length-1?{...b,c:arr[i-1].c*1.05,o:arr[i-1].c*1.03}:b)},news,date:asOf});
 const a=r.stocks.find(s=>s.symbol==='AAA');
 assert.deepEqual(a.evidence.map(e=>e.title),['after publish']);
 assert.ok(Math.abs(a.intraday-((1.05/1.03-1)*100))<1e-6);
});
test('missing pre-market snapshot is reported as missing data',()=>{assert.equal(buildSignalReport({assets,bars,session:'pre',date:asOf}).status,'missing_data')});
