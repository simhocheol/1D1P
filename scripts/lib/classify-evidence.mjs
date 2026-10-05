// Runs OpenAI classification over recent news and 8-K text during collection (never at query time).
import {responseSchema,systemPrompt,validateClassification,htmlToText} from '../../server/classify.js';
const PREFERRED=['gpt-5.5-mini','gpt-5-mini','gpt-4.1-mini','gpt-4o-mini'];
async function pickModel(key){
 const r=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error(`models HTTP ${r.status}`);
 const ids=(await r.json()).data.map(m=>m.id);
 return process.env.OPENAI_TEXT_MODEL&&ids.includes(process.env.OPENAI_TEXT_MODEL)?process.env.OPENAI_TEXT_MODEL:PREFERRED.find(m=>ids.includes(m))||ids.find(i=>/^gpt-.*mini$/.test(i));
}
async function ask(key,model,items){
 for(let attempt=0;attempt<3;attempt++){
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(120000),body:JSON.stringify({model,response_format:{type:'json_schema',json_schema:responseSchema},messages:[{role:'system',content:systemPrompt},{role:'user',content:JSON.stringify({items:items.map(({id,symbols,kind,text})=>({id,symbols,kind,text}))})}]})});
  if(r.ok){const body=await r.json();return JSON.parse(body.choices[0].message.content)}
  if(r.status!==429&&r.status<500)throw Error(`chat HTTP ${r.status}`);
  await new Promise(res=>setTimeout(res,4000*(attempt+1)));
 }
 throw Error('chat 재시도 초과');
}
async function filingText(f,ua){
 const base=f.url.slice(0,f.url.lastIndexOf('/')+1);
 try{
  const idx=await (await fetch(base+'index.json',{headers:{'User-Agent':ua},signal:AbortSignal.timeout(20000)})).json();
  const docs=idx.directory?.item||[];const ex=docs.find(d=>/ex-?99/i.test(d.name)&&/\.htm/i.test(d.name));
  const urls=[f.url,ex&&base+ex.name].filter(Boolean);let text='';
  for(const u of urls){const r=await fetch(u,{headers:{'User-Agent':ua},signal:AbortSignal.timeout(20000)});if(r.ok)text+=' '+htmlToText(await r.text()).slice(0,4000);await new Promise(res=>setTimeout(res,150))}
  return text.trim().slice(0,7000);
 }catch{return ''}
}
export async function classifyEvidence({news,filings,key,ua}){
 const model=await pickModel(key);if(!model)throw Error('사용 가능한 mini 모델 없음');
 const since=Date.now()-3*864e5,seen=new Map();
 for(const [symbol,list] of Object.entries(news))for(const n of list){if(Date.parse(n.publishedAt)<since)continue;const e=seen.get(n.url)||{id:n.url,kind:'news',symbols:[],text:`${n.title}. ${n.summary||''}`.trim()};e.symbols.push(symbol);seen.set(n.url,e)}
 const items=[...seen.values()].slice(0,400);
 if(ua)for(const f of (filings?.filings||[]).filter(f=>/^8-K/.test(f.form)&&Date.parse(f.acceptedAt)>Date.now()-4*864e5).slice(0,60)){const text=await filingText(f,ua);if(text)items.push({id:f.url,kind:'8-K',symbols:[f.symbol],text})}
 const out={},errors=[];
 const batches=[];let cur=[],size=0;for(const it of items){const len=it.text.length;if(cur.length&&(cur.length>=20||size+len>24000)){batches.push(cur);cur=[];size=0}cur.push(it);size+=len}if(cur.length)batches.push(cur);
 for(const b of batches){try{Object.assign(out,validateClassification(b,await ask(key,model,b)))}catch(e){errors.push(e.message)}}
 return {model,classifiedAt:new Date().toISOString(),inputs:items.length,checked:items.map(i=>i.id),items:out,errors};
}
