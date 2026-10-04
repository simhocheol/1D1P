import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {buildSignalReport} from '../server/signal-engine.js';
const bars=move=>{let c=100;return Array.from({length:65},(_,i)=>{c*=1+(i===64?move:Math.sin(i)*.003);return {t:new Date(Date.UTC(2026,0,i+1,14)).toISOString(),c,v:i===64&&move?300:100}})};
const report=buildSignalReport({assets:[{symbol:'AAA',name:'Test company',kind:'stock',sector:'Information Technology'},{symbol:'BBB',name:'No signal',kind:'stock',sector:'Information Technology'},{symbol:'CCC',name:'Energy test',kind:'stock',sector:'Energy'}],bars:{AAA:bars(.04),BBB:bars(0),CCC:bars(.035),SPY:bars(.002),XLK:bars(.01),XLE:bars(.02),TLT:bars(.02),USO:bars(.03),QQQ:bars(.008),GLD:bars(-.003)},news:{AAA:[{title:'AAA raises revenue guidance',url:'https://example.com/news',source:'Test fixture',publishedAt:'2026-03-06T15:00:00Z'}]}});
const b=await chromium.launch();
try{
 const p=await b.newPage({reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/api/market-data',r=>r.fulfill({json:{report}}));
 await p.goto((process.env.TEST_URL||'http://127.0.0.1:5173')+'/report');
 await p.getByLabel('GitHub 관리자 토큰 · Actions: Read').fill('github_pat_test_1234567890');
 await p.getByLabel('리포트 복호화용 Alpaca Secret Key').fill('test-secret-1234567890');
 await p.getByRole('button',{name:'리포트 조회',exact:true}).click();
 await p.getByRole('heading',{name:'매매 판단 후보',exact:true}).waitFor();
 assert.equal(await p.getByLabel('리포트 복호화용 Alpaca Secret Key').count(),0);
 assert.equal(await p.locator('.candidate-identity strong').count(),2);
 assert.ok(!(await p.locator('.candidate-ledger').innerText()).includes('BBB'));
 await p.getByRole('tab',{name:'하락 반응',exact:true}).click();
 await p.getByText('조건에 맞는 후보가 없습니다',{exact:true}).waitFor();
 await p.getByRole('tab',{name:'전체',exact:true}).click();
 await p.getByRole('button',{name:'정보기술 후보 필터'}).click();
 assert.equal(await p.locator('.candidate-identity strong').count(),1);
 await p.getByRole('button',{name:'연결 필터 초기화'}).click();
 assert.equal(await p.locator('.driver-card').count(),12);
 assert.equal(await p.locator('.driver-card.observed').count(),3);
 await p.locator('.driver-card').filter({hasText:'매출·주문'}).click();
 await p.getByRole('button',{name:'이 Driver의 연결',exact:true}).click();
 assert.equal(await p.locator('.candidate-identity strong').count(),1);
 await p.getByRole('button',{name:'연결 필터 초기화'}).click();
 await p.getByLabel('후보 검색',{exact:true}).fill('AAA');
 assert.equal(await p.locator('.candidate-identity strong').count(),1);
 await p.getByLabel('후보 검색',{exact:true}).fill('');
 await p.locator('.candidate-ledger .accordion__trigger').filter({hasText:'AAA'}).click();
 await p.getByRole('link',{name:'차트',exact:true}).waitFor();
 assert.ok((await p.locator('.candidate-ledger').innerText()).includes('후보 선정 이유'));
 for(const width of [1440,390]){
  await p.setViewportSize({width,height:1000});await p.evaluate(()=>window.scrollTo(0,0));
  await expect.poll(()=>p.locator('.accordion__panel[data-expanded="true"]').evaluateAll(nodes=>nodes.every(n=>n.scrollHeight<=n.clientHeight+3))).toBe(true);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await p.screenshot({path:`/private/tmp/1d1p-driver-report-${width}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);
 console.log('Driver to sector to candidate filters, direction tabs, search, evidence expansion and responsive layouts passed');
}finally{await b.close()}
