import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/report');
 await page.getByRole('heading',{level:1}).waitFor();
 assert.equal(await page.locator('.framework-driver').count(),12);
 await page.getByRole('button',{name:'신용·자금조달 Driver 보기',exact:true}).click();
 assert.match(await page.locator('.driver-detail').innerText(),/미확보/);
 await page.getByRole('button',{name:'공급·경쟁 구조 연결 추적',exact:true}).click();
 await page.getByRole('button',{name:'WDC 변화 추적',exact:true}).click();
 assert.match(await page.locator('#evidence-trace .trace-evidence').innerText(),/Toshiba/);
 assert.match(await page.locator('#evidence-trace .exposure-box').innerText(),/마진 감소는 아직 관측되지/);
 assert.equal(await page.locator('#evidence-trace .evidence-dimensions>div').count(),4);
 await page.getByRole('button',{name:'환율 연결 추적',exact:true}).click();
 assert.equal(await page.locator('#evidence-trace .trace-evidence').count(),0);
 await page.getByRole('button',{name:'전체 근거',exact:true}).click();
 await page.getByRole('button',{name:'NKE 변화 추적',exact:true}).click();
 assert.match(await page.locator('#evidence-trace .exposure-box').innerText(),/지역별 매출 비중/);
 await page.locator('.trace-summary').getByRole('button',{name:'종목 상세'}).click();
 await page.getByRole('dialog').waitFor();
 await page.getByRole('tab',{name:'차트 탐색'}).click();
 await page.getByRole('button',{name:'TradingView 차트 불러오기'}).waitFor();
 await page.keyboard.press('Escape');
 await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'재무부 발표 보기',exact:true}).click();
 assert.equal(await page.locator('.announcement').count(),2);
 await page.getByRole('button',{name:'연준 발표 보기',exact:true}).click();
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'리포트 데이터 다운로드'}).click();
 assert.equal((await download).suggestedFilename(),'1d1p-2026-10-02.json');
 for(const width of [1440,390,768]){
  await page.setViewportSize({width,height:1000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:`artifacts/report-v2-${width}.png`,fullPage:true});
 }
 await page.goto('http://127.0.0.1:5173/report?stock=TSLA#evidence-trace');
 await page.locator('.trace-summary').waitFor();
 assert.match(await page.locator('.trace-summary').innerText(),/TSLA/);
 assert.deepEqual(errors,[]);
 console.log('PASS: 6/3/3 framework, exposures, four separate assessments, missing evidence, modal, chart, agencies, export, deep link and responsive screenshots.');
}finally{await browser.close();}
