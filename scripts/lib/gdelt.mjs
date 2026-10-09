import {gdeltQuery,parseArticles} from '../../server/gdelt.js';
// GDELT allows one request per 5 seconds; retry politely, never throw (briefings go out without links).
export async function gdeltArticles(ids,{timespan='6h',max=40}={}){
 const u=new URL('https://api.gdeltproject.org/api/v2/doc/doc');u.search=new URLSearchParams({query:gdeltQuery(ids),mode:'artlist',format:'json',maxrecords:String(max),timespan,sort:'datedesc'}).toString();
 for(let i=0;i<3;i++){
  try{const r=await fetch(u,{signal:AbortSignal.timeout(30000)});const t=await r.text();if(r.ok&&t.trim().startsWith('{'))return {articles:parseArticles(JSON.parse(t))};
   if(!/limit requests/i.test(t))return {articles:[],error:t.slice(0,120)}}catch(e){if(i===2)return {articles:[],error:e.message}}
  await new Promise(s=>setTimeout(s,7000*(i+1)));
 }
 return {articles:[],error:'rate limited'};
}
