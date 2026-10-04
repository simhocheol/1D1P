import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch();
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/');await page.getByRole('heading',{name:'월간 Driver 관측'}).waitFor();
 await page.getByText('fed-press: 수집 성공',{exact:true}).waitFor();
 assert.equal(await page.locator('.reaction-point').count(),7);
 await page.getByRole('button',{name:'2026-10-01 매출·주문 장후 검증 기록',exact:true}).click();
 await page.getByRole('heading',{name:'매출·주문',exact:true}).waitFor();
 await page.keyboard.press('Escape');
 await page.goto(base+'/report');await page.getByText('과거 수동 검증 기록',{exact:true}).click();await page.getByRole('heading',{name:'2026-10-02',exact:true}).waitFor();
 assert.equal(await page.locator('.audit-event').count(),3);
 assert.equal(await page.getByText('기존 상세 리포트',{exact:true}).count(),0);
 await page.goto(base+'/report?date=2026-10-01');await page.getByText('과거 수동 검증 기록',{exact:true}).click();await page.getByRole('heading',{name:'2026-10-01',exact:true}).waitFor();
 assert.equal(await page.locator('.audit-event').count(),1);
 await page.goto(base+'/report?date=2026-10-03');await page.getByText('과거 수동 검증 기록',{exact:true}).click();await page.getByRole('heading',{name:'해당 날짜는 미수집입니다'}).waitFor();
 await page.goto(base+'/universe');await page.getByRole('button',{name:'AAPL',exact:true}).waitFor();assert.ok(await page.locator('tbody tr').count()>500);
 await page.getByRole('button',{name:'TSLA 관심 추가'}).click();await page.reload();await page.getByRole('button',{name:'TSLA 관심 해제'}).waitFor();
 await page.getByLabel('자산 유형').selectOption('etf');assert.equal(await page.locator('tbody tr').count(),29);
 for(const width of [1440,390]){await page.setViewportSize({width,height:900});for(const route of ['/','/report','/settings']){await page.goto(base+route);if(route==='/report')await page.getByRole('heading',{name:'오늘의 시장, 변화의 이유'}).waitFor();else await page.getByText('fed-press: 수집 성공',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route} overflow at ${width}`);}await page.screenshot({path:`/private/tmp/1d1p-production-${width}.png`,fullPage:true});}
 assert.deepEqual(errors,[]);console.log('Production routes, real records, unknown dates, watchlist and responsive layout passed');
}finally{await browser.close()}
