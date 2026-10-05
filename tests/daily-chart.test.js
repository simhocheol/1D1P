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
