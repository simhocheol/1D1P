import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize} from '../server/market-metrics.js';
import {makeHandler} from '../api/market-data.js';
import {seal,open} from '../server/market-vault.js';
import {zipSync,strToU8} from 'fflate';
test('owner can read encrypted market artifact without forwarding auth to download host',async()=>{
 const zip=zipSync({'market.enc':strToU8(seal({metrics:{AAPL:{close:100}},news:{}},'secret1234567890'))});
 let calls=0;const fetchImpl=async(url,options)=>{calls++;if(calls===1)return {ok:true,json:async()=>({login:'simhocheol'})};if(calls===2)return {ok:true,json:async()=>({artifacts:[{id:123,expired:false}]})};if(calls===3)return {status:302,headers:new Headers({location:'https://example.blob.core.windows.net/test'})};assert.equal(options.headers,undefined);return {ok:true,headers:new Headers(),arrayBuffer:async()=>zip.buffer}};
 const res={setHeader(){},end(v){this.body=JSON.parse(v)}};await makeHandler({fetchImpl})({method:'POST',headers:{origin:'http://127.0.0.1:5173',authorization:'Bearer github_pat_test_1234567890'},body:{secretKey:'secret1234567890'}},res);assert.equal(res.statusCode,200);assert.equal(res.body.metrics.AAPL.close,100);
});
test('market data encryption requires the original secret and detects tampering',()=>{const data={metrics:{AAPL:{close:100}}},sealed=seal(data,'secret1234567890');assert.ok(!sealed.includes('AAPL'));assert.deepEqual(open(sealed,'secret1234567890'),data);assert.throws(()=>open(sealed,'wrong-secret123456'));const e=JSON.parse(sealed);e.tag=Buffer.alloc(16).toString('base64');assert.throws(()=>open(JSON.stringify(e),'secret1234567890'))});
test('daily metrics preserve unknowns and compute prior-volume baseline',()=>{
 assert.equal(summarize([]),null);
 const bars=Array.from({length:60},(_,i)=>({t:new Date(Date.UTC(2026,0,i+1)).toISOString(),c:100+i,v:i===59?200:100}));
 const result=summarize(bars);assert.equal(result.sma20,149.5);assert.equal(result.sma50,134.5);assert.equal(result.rsi14,100);assert.equal(result.volumeRatio,2);assert.ok(result.change>0);
 const one=summarize([bars[0]]);assert.equal(one.change,null);assert.equal(one.sma20,null);assert.equal(one.rsi14,null);
});
test('market artifact endpoint blocks unauthenticated and foreign-owner access',async()=>{
 const res=()=>({setHeader(){},end(v){this.body=JSON.parse(v)}});
 let r=res();await makeHandler()({method:'POST',headers:{origin:'http://127.0.0.1:5173'}},r);assert.equal(r.statusCode,401);
 r=res();let calls=0;await makeHandler({fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({login:'other'})}}})({method:'POST',body:{secretKey:'secret1234567890'},headers:{origin:'http://127.0.0.1:5173',authorization:'Bearer github_pat_test_1234567890'}},r);assert.equal(r.statusCode,403);assert.equal(calls,1);
});
