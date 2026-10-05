// SEC EDGAR recent filings for S&P 500 constituents → private-market/filings.json (sealed with market data).
import fs from 'node:fs/promises';
import {edgarTime,filingEvidence} from '../server/edgar.js';
const email=process.env.SEC_CONTACT_EMAIL;
if(!email){console.error('SEC_CONTACT_EMAIL 미등록');process.exit(1)}
const headers={'User-Agent':`1D1P market research ${email}`,'Accept-Encoding':'gzip, deflate'};
const since=new Date(Date.now()-14*864e5).toISOString().slice(0,10);
async function get(url){
 for(let attempt=0;attempt<3;attempt++){
  try{const r=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});if(r.ok)return r.json();if(r.status!==429&&r.status<500)throw Error(`HTTP ${r.status}`)}catch(e){if(attempt===2)throw e}
  await new Promise(res=>setTimeout(res,2000*(attempt+1)));
 }
}
const universe=JSON.parse(await fs.readFile('public/data/universe.json','utf8'));
const symbols=new Set(universe.assets.filter(a=>a.kind==='stock').map(a=>a.symbol));
const tickers=await get('https://www.sec.gov/files/company_tickers.json');
const cik=new Map(Object.values(tickers).map(t=>[t.ticker.replace('-','.'),String(t.cik_str).padStart(10,'0')]));
const filings=[],errors=[];
for(const symbol of symbols){
 const id=cik.get(symbol);if(!id){errors.push(`${symbol}: CIK 없음`);continue}
 try{
  const sub=await get(`https://data.sec.gov/submissions/CIK${id}.json`),r=sub.filings?.recent;
  for(let i=0;i<(r?.form?.length||0);i++){
   if(r.filingDate[i]<since)break;
   const f={symbol,cik:id,form:r.form[i],items:(r.items[i]||'').split(',').filter(Boolean),filedDate:r.filingDate[i],acceptedAt:edgarTime(r.acceptanceDateTime[i]),url:`https://www.sec.gov/Archives/edgar/data/${Number(id)}/${r.accessionNumber[i].replace(/-/g,'')}/${r.primaryDocument[i]}`,description:r.primaryDocDescription?.[i]||''};
   if(f.acceptedAt&&filingEvidence(f).length)filings.push(f);
  }
 }catch(e){errors.push(`${symbol}: ${e.message}`)}
 await new Promise(res=>setTimeout(res,130));
}
await fs.mkdir('private-market',{recursive:true});
await fs.writeFile('private-market/filings.json',JSON.stringify({source:'SEC EDGAR submissions API',collectedAt:new Date().toISOString(),since,filings,errors}));
console.log(`EDGAR ${filings.length} Driver filings since ${since} · ${symbols.size-errors.length}/${symbols.size} companies${errors.length?` · ${errors.length} errors`:''}`);
if(errors.length>symbols.size/2)process.exit(1);
