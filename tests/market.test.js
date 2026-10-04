import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize} from '../server/market-metrics.js';
import {makeHandler} from '../api/market-data.js';
test('daily metrics preserve unknowns and compute prior-volume baseline',()=>{
 assert.equal(summarize([]),null);
 const bars=Array.from({length:60},(_,i)=>({t:new Date(Date.UTC(2026,0,i+1)).toISOString(),c:100+i,v:i===59?200:100}));
 const result=summarize(bars);assert.equal(result.sma20,149.5);assert.equal(result.sma50,134.5);assert.equal(result.rsi14,100);assert.equal(result.volumeRatio,2);assert.ok(result.change>0);
 const one=summarize([bars[0]]);assert.equal(one.change,null);assert.equal(one.sma20,null);assert.equal(one.rsi14,null);
});
test('market artifact endpoint blocks unauthenticated and foreign-owner access',async()=>{
 const res=()=>({setHeader(){},end(v){this.body=JSON.parse(v)}});
 let r=res();await makeHandler()({method:'POST',headers:{origin:'http://127.0.0.1:5173'}},r);assert.equal(r.statusCode,401);
 r=res();let calls=0;await makeHandler({fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({login:'other'})}}})({method:'POST',headers:{origin:'http://127.0.0.1:5173',authorization:'Bearer github_pat_test_1234567890'}},r);assert.equal(r.statusCode,403);assert.equal(calls,1);
});
