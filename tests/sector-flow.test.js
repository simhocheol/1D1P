import test from 'node:test';
import assert from 'node:assert/strict';
import {macroSectorScores,regimeLine,relStrength,rsStage,sectorVerdict,pickStocks} from '../server/sector-flow.js';
const context={items:[{id:'rate10',percentile:100},{id:'real10',percentile:100},{id:'dollar',percentile:90},{id:'cpi',percentile:75},{id:'curve',percentile:36,value:0.48},{id:'vix',percentile:38}],direction:{items:[{id:'retail',trend:'up'},{id:'industry',trend:'up'},{id:'claims',trend:'up'},{id:'payrolls',trend:'down'}]}};
test('macro rules score sectors with reasons', ()=>{
 const m=macroSectorScores(context);
 assert.ok(m.Financials.score>=2);assert.ok(m['Real Estate'].score<0);assert.ok(m['Information Technology'].score<0);
 assert.ok(m.Financials.plus.some(r=>r.includes('금리')));
 assert.deepEqual(regimeLine(context),['고금리','강달러','물가 부담','경기 개선 중']);
});
test('relative strength, verdict and picks inside favored sectors', ()=>{
 const up=Array.from({length:30},(_,i)=>100+i),flat=Array(30).fill(100);
 assert.ok(relStrength(up,flat,5)>2);assert.equal(rsStage(3),'strong');assert.equal(relStrength([1],[1],5),null);
 const v=sectorVerdict({macro:{score:2},rs1w:3,rs1m:3,flow:{dir:'in'}});assert.equal(v.verdict,'유리');assert.equal(v.confirmed,true);
 assert.equal(sectorVerdict({macro:{score:-2},rs1w:-3,rs1m:-3,flow:null}).verdict,'불리');
 const picks=pickStocks({favored:[{id:'Financials'}],active:[{symbol:'JPM',sector:'Financials'},{symbol:'NVDA',sector:'Information Technology'}],candidates:[{symbol:'GS',name:'Goldman',sector:'Financials',drivers:['금리']},{symbol:'JPM',sector:'Financials'}]});
 assert.deepEqual(picks.map(p=>[p.symbol,p.basis]),[['JPM','거래 집중'],['GS','리포트 근거']]);
});
