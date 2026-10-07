import test from 'node:test';
import assert from 'node:assert/strict';
import {contextIndicators,describe,overall,percentile,yoy} from '../server/market-context.js';

const ind=id=>contextIndicators.find(i=>i.id===id);
const now=new Date('2026-10-07T00:00:00Z');
const series=(f)=>Array.from({length:30*12},(_,i)=>{const y=1997+Math.floor(i/12),m=i%12+1;return {d:`${y}-${String(m).padStart(2,'0')}-01`,v:f(y,m)}});
test('percentile and plain position', ()=>{
 assert.equal(percentile([1,2,3,4],4),100);assert.equal(percentile([1,2,3,4],1),25);
 const d=describe(ind('rate10'),series(y=>y>=2009&&y<=2021?2:4.5),{now});
 assert.ok(d.percentile>=70);assert.equal(d.value,4.5);
 assert.ok(d.compare.includes('저금리 시대 평균 2%'));
});
test('restricted series publish positions only', ()=>{
 const d=describe(ind('vix'),series((y,m)=>10+m),{now});
 assert.equal(d.value,undefined);assert.equal(d.average,undefined);assert.ok(Number.isFinite(d.percentile));
 assert.ok(d.eras.every(e=>e.avg===undefined));
});
test('yoy inflation transform', ()=>{
 const r=yoy([{d:'2025-01-01',v:100},{d:'2026-01-01',v:103}]);
 assert.equal(r.length,1);assert.ok(Math.abs(r[0].v-3)<1e-9);
});
test('overall reading names the high-rates high-stocks combination', ()=>{
 const lines=overall([{id:'rate10',percentile:85},{id:'stocks',percentile:97},{id:'curve',percentile:20,value:-0.2}]);
 assert.ok(lines[0].includes('금리와 주가가 동시에'));assert.ok(lines.some(l=>l.includes('뒤집혀')));
 assert.deepEqual(overall([]),['대부분의 지표가 과거 보통 범위 안에 있어요.']);
});
test('scenarios rank by support and only name public values', async ()=>{
 const {scenarios}=await import('../server/market-context.js');
 const items=[{id:'rate10',name:'10년물',value:5.3,unit:'%',percentile:100,position:'매우 높음'},{id:'real10',name:'실질',value:2.9,unit:'%',percentile:100,position:'매우 높음'},{id:'stocks',name:'실질 주가',percentile:100,position:'매우 높음'},{id:'dollar',name:'달러',value:121,unit:'',percentile:40,position:'보통'}];
 const r=scenarios(items);
 assert.equal(r[0].rank,1);assert.equal(r[0].strength,'강함');assert.ok(r[0].score>=r[1].score);
 assert.ok(r.find(x=>x.id==='stretched').basis.includes('실질 주가 매우 높음'));
 assert.equal(r.length,3);
});
test('direction compares recent and prior averages with the right sign', async ()=>{
 const {direction,directionIndicators,directionSummary,globalSummary}=await import('../server/market-context.js');
 const ind=id=>directionIndicators.find(i=>i.id===id);
 const weekly=v=>v.map((x,i)=>({d:`2026-0${1+Math.floor(i/4)}-0${1+i%4}`,v:x}));
 assert.equal(direction(ind('claims'),weekly([200,200,200,200,200,200,200,200,240,240,240,240])).trend,'down');
 assert.equal(direction(ind('retail'),weekly([100,100,100,100,101,101,101])).trend,'up');
 const pay=direction(ind('payrolls'),weekly([0,200,400,600,700,800,900]));assert.equal(pay.trend,'down');
 const s=direction(ind('sentiment'),weekly([60,60,60,60,70,70,70]));assert.equal(s.latest,undefined);
 assert.ok(directionSummary([{trend:'up'},{trend:'up'},{trend:'flat'}]).includes('좋아지는'));
 assert.ok(globalSummary([{id:'krw',value:1450,percentile:90}])[0].includes('1450원'));
});
