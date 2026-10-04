import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/dashboard.html');
 await page.locator('.reaction-row').first().waitFor();
 assert.equal(await page.locator('.reaction-row').count(),13);
 assert.equal(await page.locator('.axis-day').count(),31);
 assert.equal(await page.locator('.reaction-point').count(),5);
 await page.getByRole('button',{name:'2026-10-02 수요·성장 장후 강도 4',exact:true}).click();
 await page.getByRole('dialog').waitFor();
 assert.match(await page.getByRole('dialog').innerText(),/예상 대비/);
 await page.keyboard.press('Escape');
 await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'장전',exact:true}).click();
 assert.equal(await page.locator('.reaction-point').count(),0);
 await page.getByRole('button',{name:'장전 + 장후',exact:true}).click();
 await page.getByRole('button',{name:'실적 발표',exact:true}).click();
 assert.equal(await page.locator('.calendar-event').count(),1);
 await page.locator('.calendar-event').click();
 assert.match(await page.locator('.date-detail').innerText(),/21일/);
 await page.getByRole('button',{name:'한국',exact:true}).click();
 assert.equal(await page.locator('.calendar-event').count(),0);
 assert.match(await page.locator('.cal-warning').innerText(),/아직 수집/);
 await page.getByRole('button',{name:'전체 지역',exact:true}).click();
 await page.getByRole('button',{name:'전체',exact:true}).click();
 await page.getByRole('button',{name:'주별',exact:true}).click();
 assert.equal(await page.locator('.calendar-cell').count(),7);
 await page.getByRole('button',{name:'월별',exact:true}).click();
 await page.getByRole('button',{name:'다음 달',exact:true}).click();
 assert.equal(await page.locator('.axis-day').count(),30);
 assert.equal(await page.locator('.reaction-point').count(),0);
 await page.getByRole('button',{name:'이전 달',exact:true}).click();
 await page.getByRole('button',{name:'10월 2일 선택',exact:true}).click();
 for(const width of [1440,390,768]){
  await page.setViewportSize({width,height:1000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`artifacts/calendar-${width}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: month boundaries, 12 drivers, session filters, source-backed earnings, region empty state, week view, modal and responsive screenshots.');
}finally{await browser.close();}
