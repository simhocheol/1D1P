import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSignalReport} from '../server/signal-engine.js';
// 70 trading days; XLF falls when the high-yield spread widens.
const days=Array.from({length:70},(_,i)=>new Date(Date.UTC(2026,0,1)+i*864e5));
const spread=days.map((d,i)=>2+Math.sin(i*1.3)*0.1+(i===69?0.25:0));
const bars=(sens,last=0)=>{let c=100;return days.map((d,i)=>{if(i)c*=1+sens*(spread[i]-spread[i-1])/100*10+Math.cos(i*7)*0.0005+(i===69?last:0);return {t:new Date(d.getTime()+14*3600e3).toISOString(),o:c,h:c,l:c,c,v:i===69?300:100}})};
const flat=()=>bars(0);
const asOf=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date(days[69].getTime()+14*3600e3));
const macro={series:{BAMLH0A0HYM2:{lastUpdated:null,observations:days.map((d,i)=>({d:new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date(d.getTime()+14*3600e3)),v:spread[i]}))}}};
test('an active FRED spread move links the exposed sector and its abnormal mover',()=>{
 const r=buildSignalReport({assets:[{symbol:'BNK',name:'Bank',kind:'stock',sector:'Financials'}],bars:{BNK:bars(-1.5,-0.03),XLF:bars(-1),SPY:flat(),TLT:flat(),USO:flat(),QQQ:flat(),GLD:flat()},macro,date:asOf});
 assert.ok(r.macro.find(m=>m.id==='BAMLH0A0HYM2').active);
 const fin=r.thesis.sectors.find(s=>s.name==='Financials');
 assert.ok(fin?.driverIds.includes('credit'));
 assert.ok(r.thesis.candidates.find(c=>c.symbol==='BNK')?.paths.some(p=>p.driverId==='credit'&&p.basis.startsWith('FRED')));
 assert.ok(r.thesis.drivers.find(d=>d.id==='credit').sectorIds.includes('Financials'));
});
test('no link when the sector moved against the channel',()=>{
 const r=buildSignalReport({assets:[],bars:{XLF:bars(1),SPY:flat(),TLT:flat(),USO:flat(),QQQ:flat(),GLD:flat()},macro,date:asOf});
 assert.ok(!r.thesis.sectors.some(s=>s.name==='Financials'&&s.driverIds.includes('credit')));
});
