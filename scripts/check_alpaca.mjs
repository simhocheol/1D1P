import fs from 'node:fs/promises';
import {verifyAlpaca,validCredentials,alpacaConfig} from '../server/alpaca.js';
const key=process.env.ALPACA_API_KEY,secret=process.env.ALPACA_SECRET_KEY;
let state={...alpacaConfig,checkedAt:new Date().toISOString(),status:'missing_keys',publishingEnabled:false};
if(key||secret){if(!validCredentials(key,secret))state.status='error';else{const result=await verifyAlpaca(key,secret);state.status=result.ok?'verified':'error';state.hasData=result.hasData??false}}
const output=new URL('../public/data/market-connection.json',import.meta.url);
await fs.mkdir(new URL('../public/data/',import.meta.url),{recursive:true});
await fs.writeFile(output,JSON.stringify(state,null,2)+'\n');
console.log(`Alpaca ${state.status}; feed=iex; read-only; price publishing disabled`);
if(state.status==='error')process.exitCode=1;
