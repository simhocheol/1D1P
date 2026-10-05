import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyChart} from '../server/signal-engine.js';
const rows=Array.from({length:200},(_,i)=>{const t=new Date(Date.UTC(2026,2,1,15)+i*864e5);return {t:t.toISOString(),o:100+i,h:102+i,l:99+i,c:101+i}});
test('daily chart covers one calendar month before the report date with moving averages',()=>{
 const asOf=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date(rows.at(-1).t));
 const chart=dailyChart(rows,asOf);
 assert.equal(chart.to,asOf);
 assert.ok(chart.bars.every(b=>b.d>chart.from&&b.d<=asOf));
 assert.ok(chart.bars.length>=28&&chart.bars.length<=31);
 for(const k of ['20','50','60','120'])assert.equal(chart.ma[k].length,chart.bars.length);
 assert.equal(chart.ma['20'].at(-1),rows.slice(-20).reduce((s,b)=>s+b.c,0)/20);
});
test('daily chart keeps missing long averages as null',()=>{const short=rows.slice(0,70);const asOf=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date(short.at(-1).t));assert.ok(dailyChart(short,asOf).ma['120'].every(v=>v===null))});
import {buildSignalReport} from '../server/signal-engine.js';
test('report build stays fast for a full S&P 500 universe',()=>{
 const mk=(seed)=>{let c=100;return Array.from({length:180},(_,i)=>{c*=1+Math.sin(i*seed)*.01+(i===179?(seed%7-3)*.02:0);return {t:new Date(Date.UTC(2026,2,1,20)+i*864e5).toISOString(),o:c,h:c*1.02,l:c*.97,c,v:i===179?500:100}})};
 const sectors=['Information Technology','Financials','Energy','Health Care','Industrials'];
 const assets=Array.from({length:503},(_,i)=>({symbol:'S'+i,name:'Co '+i,kind:'stock',sector:sectors[i%5]}));
 const bars=Object.fromEntries([...assets.map((a,i)=>[a.symbol,mk(i+1)]),...['SPY','QQQ','TLT','GLD','USO','XLK','XLF','XLE','XLV','XLI'].map((s,i)=>[s,mk(i+.5)])]);
 const t=performance.now();const r=buildSignalReport({assets,bars});
 assert.ok(performance.now()-t<1500,`took ${Math.round(performance.now()-t)}ms`);
 assert.ok(r.stocks.every(s=>s.chart===undefined));
});
