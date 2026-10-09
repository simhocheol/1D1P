import test from 'node:test';
import assert from 'node:assert/strict';
import {cardChanges,briefingNews,validateBriefing,fallbackBriefing,appendBriefing} from '../server/pulse-briefing.js';
const cur={at:'2026-10-09T14:20:00Z',session:'regular',pattern:{id:'risk_off',name:'위험 회피'},summary:'투자자들이 겁을 먹었어요. 더 있어요.',groups:{stocks:-1,gold:2,oil:0,rates:null}};
const prev={groups:{stocks:0,gold:1,oil:0,rates:1}};
const news=[{title:'Stocks fall as yields climb',summary:'',symbols:[],source:'benzinga'},{title:'Gold hits record',summary:'',symbols:['GLD'],source:'reuters'},{title:'Miner output',summary:'gold',symbols:['NEM']}];
test('card changes and notable movers', ()=>{
 const c=cardChanges(cur,prev);
 assert.deepEqual(c.changed.map(x=>x.id),['stocks','gold']);assert.deepEqual(c.notable,['stocks','gold']);
 assert.equal(briefingNews(news,['stocks','gold']).length,2);
});
test('briefing validation and fallback', ()=>{
 const ok=validateBriefing({confident:true,title:'금리 부담에 주가 약세',bullets:['주가가 하락으로 바뀌었어요.','금리가 올라 부담이 됐어요.','금은 안전자산 수요로 올랐어요.'],news_ids:[0,1]},news);
 assert.equal(ok.sources.count,2);assert.equal(ok.ai,true);
 assert.equal(validateBriefing({confident:true,title:'주가 1% 하락',bullets:['a','b','c'],news_ids:[0,1]},news),null);
 assert.equal(validateBriefing({confident:true,title:'x',bullets:['a','b','c'],news_ids:[0]},news),null);
 const f=fallbackBriefing({cur,changes:cardChanges(cur,prev)});assert.equal(f.bullets.length,3);assert.equal(f.ai,false);assert.ok(f.title.includes('금'));
 assert.equal(appendBriefing(appendBriefing(null,{at:'a'}),{at:'a'}).items.length,1);
});
test('gdelt query and parsing keep outlet links only', async ()=>{
 const {gdeltQuery,parseArticles}=await import('../server/gdelt.js');
 assert.ok(gdeltQuery(['gold','oil']).includes('(gold OR oil)'));
 const a=parseArticles({articles:[{url:'https://www.reuters.com/markets/x',title:'Gold rises',seendate:'20261009T120000Z'},{url:'http://cnbc.com/y',title:'Insecure'},{url:'https://spam.example/z',title:'Other'},{url:'https://www.cnbc.com/z',title:'gold rises'}]});
 assert.equal(a.length,1);assert.equal(a[0].domain,'reuters.com');assert.equal(a[0].at,'2026-10-09T12:00:00Z');
 const {validateBriefing}=await import('../server/pulse-briefing.js');
 const v=validateBriefing({confident:true,title:'금 상승',bullets:['a','b','c'],news_ids:[0,1],link_ids:[0,5]},[{title:'x'},{title:'y'}],a);
 assert.equal(v.links.length,1);
});
test('consistency gate catches claims that contradict cards or money flow', async ()=>{
 const {claimProblems,textClaims}=await import('../server/pulse-briefing.js');
 const cur={groups:{gold:1,rates:0,stocks:-1,silver:null}},flows=[{id:'commodities',dir:null},{id:'crypto',dir:'flat'}];
 assert.deepEqual(claimProblems([{target:'gold',direction:'up'},{target:'stocks',direction:'down'}],cur,flows),[]);
 assert.equal(claimProblems([{target:'rates',direction:'up'}],cur,flows).length,1);
 assert.equal(claimProblems([{target:'flow:commodities',direction:'in'}],cur,flows).length,1);
 assert.equal(claimProblems([{target:'flow:crypto',direction:'flat'}],cur,flows).length,0);
 assert.deepEqual(textClaims('금리 상승 우려에 금이 올랐어요'),[{target:'rates',direction:'up'},{target:'gold',direction:'up'}]);
 assert.deepEqual(textClaims('은이 하락했어요'),[{target:'silver',direction:'down'}]);
 assert.equal(textClaims('지난 확인 이후 큰 변화는 없었어요').length,0);
 assert.ok(textClaims('안전자산인 금·은으로 자금이 일부 옮겨갔어요').some(c=>c.target==='flow:commodities'&&c.direction==='in'));
 assert.ok(textClaims('주식에서 돈이 빠졌어요').some(c=>c.target==='flow:stocks'&&c.direction==='out'));
});
