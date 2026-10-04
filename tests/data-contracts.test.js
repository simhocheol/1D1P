import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {drivers} from '../src/framework.js';
test('production framework contains definitions, not sample price or intensity observations',()=>{
 assert.equal(drivers.length,12);
 for(const d of drivers){assert.ok(d.definition);assert.equal(d.score,undefined);assert.equal(d.observation,undefined);}
});
test('collected metadata has source and times but no invented analysis',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('../public/data/official-feed.json',import.meta.url)));
 assert.equal(data.feeds.length,5);
 const ids=new Set();
 for(const e of data.events){assert.equal(ids.has(e.id),false);ids.add(e.id);assert.ok(e.url.startsWith('https://'));assert.ok(Number.isFinite(Date.parse(e.publishedAt)));assert.ok(e.fetchedAt&&e.firstSeenAt);assert.equal(e.analysisStatus,'unreviewed');assert.equal(e.score,undefined);}
});
test('production route imports do not fall back to legacy sample modules',()=>{
 for(const file of ['service.jsx','calendar.jsx','monthly-drivers.jsx','verified-report.jsx']){
  const source=fs.readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');
  assert.equal(/from ['"]\.\/(report\.js|report-page\.jsx|trace-data\.js)['"]/.test(source),false,file);
 }
});
