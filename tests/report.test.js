import test from 'node:test';
import assert from 'node:assert/strict';
import {report,relative,sources} from '../src/report.js';
test('market-relative return separates positive returns from outperformance',()=>{assert.equal(relative(.4),-.33);assert.equal(relative(1.4),.67);assert.equal(relative(-3.6),-4.33)});
test('reported approximate stock returns remain marked, with no fabricated indicators',()=>{for(const s of report.stocks){assert.ok(sources.some(x=>x.id===s.source));assert.equal(s.rsi,undefined);assert.equal(s.close,undefined)}for(const ticker of ['WDC','STX'])assert.equal(report.stocks.find(s=>s.symbol===ticker).approximate,true)});
import { drivers, activityScore } from '../src/report.js';
import {evidenceLinks} from '../src/trace-data.js';
import {calendarEvents,driverSnapshots,monthDays} from '../src/calendar-data.js';
test('calendar distinguishes scheduled events and recorded reactions',()=>{
 assert.equal(monthDays(2026,9),31);
 assert.equal(monthDays(2026,10),30);
 assert.equal(monthDays(2028,1),29);
 assert.ok(calendarEvents.every(e=>e.url.startsWith('https://')&&e.checked&&e.date));
 assert.equal(calendarEvents.find(e=>e.type==='earnings').date,'2026-10-21');
 assert.equal(driverSnapshots.length,2);
 assert.ok(driverSnapshots.every(s=>s.session==='post'&&s.date==='2026-10-02'));
});
test('evidence connections reference known drivers, stocks and sources',()=>{
 for(const e of evidenceLinks){
  assert.ok(e.limit&&e.time);
  assert.ok(['bls','reuters','kip'].includes(e.source));
  assert.ok(e.drivers.every(name=>drivers.some(d=>d.name===name)));
  assert.ok(e.stocks.every(symbol=>['NVDA','TSLA','NKE','WDC','STX'].includes(symbol)));
 }
 assert.equal(evidenceLinks.some(e=>e.drivers.includes('AI CAPEX')),false);
});
test('driver intensity uses absolute observations and keeps missing data unknown',()=>{
 assert.equal(drivers.length,12);
 assert.equal(activityScore(-4.5,2),3);
 assert.equal(activityScore(null,2),null);
 assert.equal(activityScore(0,2),0);
 assert.equal(activityScore(30,2),5);
 assert.equal(drivers.find(d=>d.id==='credit').score,null);
 assert.equal(drivers.filter(d=>d.layer==='macro').length,6);
 assert.equal(drivers.filter(d=>d.layer==='industry').length,3);
 assert.equal(drivers.filter(d=>d.layer==='company').length,3);
 assert.ok(drivers.every(d=>d.definition&&d.indicators));
 assert.ok(!drivers.some(d=>['Nasdaq','VIX','BTC','AI CAPEX'].includes(d.name)));
 assert.ok(evidenceLinks.every(e=>e.exposure&&e.confidence&&e.assessment));
});
