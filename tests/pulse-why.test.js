import test from 'node:test';
import assert from 'node:assert/strict';
import {pickMovers,matchNews,validateWhy} from '../server/pulse-why.js';

const news=[{title:'Gold climbs as dollar weakens',summary:'',symbols:[],source:'benzinga',publishedAt:'2026-10-09T01:00:00Z'},{title:'Bullion demand from central banks',summary:'',symbols:['GLD'],source:'reuters',publishedAt:'2026-10-09T02:00:00Z'},{title:'Oil slips',summary:'',symbols:[],source:'benzinga',publishedAt:'2026-10-09T00:00:00Z'}];
test('picks strongest movers and matches news by keyword or symbol', ()=>{
 assert.deepEqual(pickMovers({gold:2,oil:-1,stocks:0,copper:null}).map(m=>m.id),['gold','oil']);
 assert.equal(matchNews('gold',news).length,2);
 assert.equal(matchNews('gold',[{title:'Gold miner cuts output target',summary:'',symbols:['NEM']}]).length,0);
});
test('validation keeps supported cards and rejects figures or low confidence', ()=>{
 const ok=validateWhy({confident:true,title:'달러 약세로 금 상승',bullets:['달러가 약해졌어요.','중앙은행 수요도 받쳐 줬어요.'],tags:['달러 약세','중앙은행'],news_ids:[0,1,9]},news.slice(0,2),'gold',2);
 assert.equal(ok.sources.count,2);assert.deepEqual(ok.sources.publishers,['benzinga','reuters']);assert.ok(!JSON.stringify(ok).includes('Gold climbs'));
 assert.equal(validateWhy({confident:false,title:'x',bullets:['a','b'],tags:[],news_ids:[0]},news,'gold',1),null);
 assert.equal(validateWhy({confident:true,title:'금 1.6% 상승',bullets:['a','b'],tags:[],news_ids:[0]},news,'gold',1),null);
 assert.equal(validateWhy({confident:true,title:'금 상승',bullets:['a','b'],tags:[],news_ids:[]},news,'gold',1),null);
});
