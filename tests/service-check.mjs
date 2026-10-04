import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');
 await page.getByRole('heading',{name:'시장 캘린더',exact:true}).waitFor();
 assert.match(await page.locator('.service-brand').innerText(),/1D1P/);
 await page.locator('.service-header').getByRole('link',{name:'종목·ETF'}).click();
 await page.getByRole('searchbox').fill('Nike');
 assert.equal(await page.locator('tbody tr').count(),1);
 await page.getByRole('button',{name:'NKE 관심 추가'}).click();
 await page.reload();
 await page.getByRole('button',{name:'NKE 관심 해제'}).waitFor();
 await page.getByRole('button',{name:'NKE 관심 해제'}).click();
 await page.getByLabel('자산 유형').selectOption('etf');
 assert.match(await page.locator('.service-empty').innerText(),/아직 연결/);
 await page.getByLabel('자산 유형').selectOption('all');
 await page.locator('tbody tr').filter({hasText:'TSLA'}).getByRole('link',{name:'추적'}).click();
 await page.locator('.trace-summary').waitFor();
 assert.match(await page.locator('.trace-summary').innerText(),/TSLA/);
 await page.locator('.service-header').getByRole('link',{name:'발행 설정'}).click();
 await page.getByLabel('장전 발행 시각').fill('08:45');
 await page.getByRole('button',{name:'설정 저장'}).click();
 await page.reload();
 assert.equal(await page.getByLabel('장전 발행 시각').inputValue(),'08:45');
 await page.getByLabel('장전 발행 시각').fill('09:00');
 await page.getByRole('button',{name:'설정 저장'}).click();
 for(const path of ['/','/report','/universe','/settings']){
  await page.goto(`http://127.0.0.1:5173${path}`);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`artifacts/1d1p-${path.slice(1)||'calendar'}-mobile.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: 1D1P routes, watch persistence, ETF status, stock deep link, preference persistence and mobile layouts.');
}finally{await browser.close();}
