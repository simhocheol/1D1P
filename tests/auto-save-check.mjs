import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
 const page=await browser.newPage();let saves=0,checks=0,failCheck=false,failSave=false;
 await page.route('**/api/credentials',async route=>{
  const body=route.request().postDataJSON();
  if(body.action==='status')return route.fulfill({json:{owner:'simhocheol',saved:{}}});
  saves++;assert.ok(body.apiKey);if(body.provider==='alpaca')assert.ok(body.secretKey);
  return route.fulfill({status:failSave?403:200,json:failSave?{message:'denied'}:{persisted:true,message:'암호화 저장 완료'}});
 });
 for(const provider of ['alpaca','openai'])await page.route(`**/api/${provider}-connection`,route=>{checks++;return route.fulfill({status:failCheck?401:200,json:{verified:!failCheck,message:'연결 실패'}})});
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:5173')+'/settings');
 const key=page.getByLabel('Alpaca API Key'),secret=page.getByLabel('Alpaca Secret Key');
 async function fill(){await key.fill('test-key-1234567890');await secret.fill('test-secret-1234567890')}
 const submit=page.getByRole('button',{name:'Alpaca 연결 테스트',exact:true});
 await fill();await submit.click();await page.getByText('먼저 GitHub 관리자 인증을 완료해 주세요.',{exact:true}).waitFor();assert.equal(checks,0);assert.equal(saves,0);
 await page.getByLabel('GitHub 관리자 토큰').fill('github_pat_test_1234567890');await page.getByRole('button',{name:'관리자 인증',exact:true}).click();await page.getByRole('button',{name:'관리자 인증 해제'}).waitFor();
 await submit.click();await page.getByText('연결 확인 성공 · 암호화 저장 완료',{exact:true}).waitFor();assert.equal(saves,1);assert.equal(await key.inputValue(),'');assert.equal(await secret.inputValue(),'');
 failCheck=true;await fill();await submit.click();await page.getByText('연결 실패',{exact:true}).waitFor();assert.equal(saves,1);
 failCheck=false;failSave=true;await fill();await submit.click();await page.getByText(/연결은 성공했지만 암호화 저장에 실패/).waitFor();assert.equal(saves,2);
 failSave=false;const openai=page.getByLabel('API 키 · 연결 테스트');await openai.fill('sk-test-12345678901234567890');await page.getByRole('button',{name:'연결 테스트',exact:true}).click();await page.locator('.api-settings').filter({has:openai}).getByText('연결 확인 성공 · 암호화 저장 완료',{exact:true}).waitFor();assert.equal(saves,3);assert.equal(await openai.inputValue(),'');
 assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}).includes('test-secret')),false);
 console.log('Both providers: auth guard, automatic save, failed verification skips save, save failure distinction and cleared inputs passed');
}finally{await browser.close()}
