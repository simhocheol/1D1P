import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
const sample={date:'2026-10-02',coverage:503,total:503,status:'ok',drivers:[{symbol:'SPY',label:'시장 위험선호',active:true,change:1.1,z:2}],sectors:[],stocks:[],events:[]};
try {
 const page=await browser.newPage();let requests=0,fail=false,hold;
 await page.route('**/api/credentials',route=>route.fulfill({json:route.request().postDataJSON().action==='save'?{persisted:true,message:'암호화 저장 완료',updatedAt:'2026-10-04T00:00:00Z'}:{owner:'simhocheol',saved:{}}}));
 await page.route('**/api/market-data',async route=>{requests++;assert.equal(route.request().headers().authorization,'Bearer github_pat_test_1234567890');assert.equal(route.request().postDataJSON().secretKey,'test-secret-1234567890');if(hold)await hold;return route.fulfill({status:fail?502:200,json:fail?{message:'수집 서버 오류'}:{report:sample}})});
 await page.goto(base+'/settings');await page.getByLabel('GitHub 관리자 토큰').fill('github_pat_test_1234567890');await page.getByRole('button',{name:'관리자 인증',exact:true}).click();await page.getByRole('button',{name:'관리자 인증 해제'}).waitFor();await page.getByLabel('Alpaca API Key').fill('test-api-key-1234567890');await page.getByLabel('Alpaca Secret Key').fill('test-secret-1234567890');await page.getByRole('button',{name:'Alpaca 암호화 저장',exact:true}).click();await page.getByRole('status').filter({hasText:'암호화 저장 완료'}).waitFor();
 await page.goto(base+'/report');await page.getByText('기기 연결됨',{exact:true}).waitFor();assert.equal(await page.getByLabel('리포트 복호화용 Alpaca Secret Key').count(),0);assert.equal(requests,0);
 await page.getByRole('button',{name:'리포트 조회',exact:true}).click();await page.getByRole('heading',{name:'Driver 대리지표 변화'}).waitFor();assert.equal(requests,1);
 await page.reload();await page.getByRole('heading',{name:'Driver 대리지표 변화'}).waitFor();assert.equal(requests,1);assert.equal(await page.getByLabel('리포트 복호화용 Alpaca Secret Key').count(),0);
 await page.getByLabel('거래일 · ET').fill('2026-10-01');assert.equal(requests,1);await page.getByText('2026-10-02 · 유의미한 변화만 선별',{exact:true}).waitFor();
 let resume;hold=new Promise(r=>{resume=r});fail=true;await page.getByRole('button',{name:'리포트 조회',exact:true}).click();await page.getByRole('heading',{name:'Driver 대리지표 변화'}).waitFor();resume();await page.getByRole('alert').filter({hasText:'수집 서버 오류'}).waitFor();assert.equal(requests,2);await page.getByRole('heading',{name:'Driver 대리지표 변화'}).waitFor();
 await page.reload();await page.getByRole('heading',{name:'Driver 대리지표 변화'}).waitFor();assert.equal(requests,2);
 const encrypted=await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('1d1p-device-vault');req.onsuccess=()=>resolve(req.result);req.onerror=reject});const get=name=>new Promise(resolve=>{const req=db.transaction('vault').objectStore('vault').get(name);req.onsuccess=()=>resolve(req.result)});const record=await get('data'),key=await get('key');db.close();return {text:new TextDecoder().decode(record.bytes),extractable:key.extractable}});
 assert.equal(encrypted.extractable,false);assert.ok(!encrypted.text.includes('test-secret'));assert.ok(!encrypted.text.includes('github_pat'));assert.ok(!encrypted.text.includes('시장 위험선호'));
 for(const width of [1440,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const bg=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);assert.match(bg,/rgb\((\d+), \1, \1\)/);await page.screenshot({path:`/private/tmp/1d1p-persist-${width}.png`,fullPage:true})}
 await page.getByRole('button',{name:'이 기기 연결 및 결과 삭제'}).click();await page.getByLabel('리포트 복호화용 Alpaca Secret Key').waitFor();await page.reload();await page.getByLabel('리포트 복호화용 Alpaca Secret Key').waitFor();assert.equal(await page.getByRole('heading',{name:'Driver 대리지표 변화'}).count(),0);
 console.log('Settings reuse, one-click queries, encrypted device storage, snapshot restore, no auto fetch, failed refresh retention, logout deletion and grayscale backgrounds passed');
}finally{await browser.close()}
