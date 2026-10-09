// Hourly briefing: card changes since the previous pulse, explained with recent market news via OpenAI.
import {pickModel,recentNews} from './pulse-why.mjs';
import {gdeltArticles} from './gdelt.mjs';
import {cardChanges,briefingNews,briefingSchema,briefingPrompt,validateBriefing,fallbackBriefing,claimProblems,textClaims} from '../../server/pulse-briefing.js';
export async function buildBriefing({cur,prev,alpacaHeaders,openaiKey,flows=[]}){
 const changes=cardChanges(cur,prev);
 const base={at:cur.at,session:cur.session,pattern:cur.pattern,changed:changes.changed,notable:changes.notable,flows};
 if(!openaiKey)return {...base,...fallbackBriefing({cur,changes}),note:'no-openai-key'};
 try{
  const ids=[...new Set([...changes.changed.map(c=>c.id),...changes.notable])];
  const [model,all,gd]=await Promise.all([pickModel(openaiKey),recentNews(alpacaHeaders),gdeltArticles(ids)]);const links=gd.articles.slice(0,25);
  const news=briefingNews(all,ids.length?ids:['stocks','rates']);
  if(news.length<2)return {...base,...fallbackBriefing({cur,changes}),note:'few-news'};
  const messages=briefingPrompt({session:cur.session,cur,changes,news,links,flows});
  const ask=async msgs=>{const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${openaiKey}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(120000),
   body:JSON.stringify({model,response_format:{type:'json_schema',json_schema:{name:'pulse_briefing',strict:true,schema:briefingSchema}},messages:msgs})});if(!r.ok)throw Error(`chat HTTP ${r.status}`);return (await r.json()).choices[0].message.content};
  // Consistency gate: declared claims plus claims read from the text must match card levels and money flow;
  // one corrected retry, then fall back.
  const check=raw=>{const j=JSON.parse(raw);return claimProblems([...(j.claims||[]),...textClaims([j.title,...(j.bullets||[])].join(' '))],cur,flows)};
  let raw=await ask(messages),problems=check(raw),retried=false;
  if(problems.length){retried=true;raw=await ask([...messages,{role:'assistant',content:raw},{role:'user',content:`다음 내용이 실제 데이터와 달라요: ${problems.join(' / ')}. 데이터와 맞게 제목·문장·claims를 고쳐 다시 JSON으로 답해.`}]);problems=check(raw)}
  const ok=problems.length?null:validateBriefing(JSON.parse(raw),news,links);
  const note=ok?`model ${model} · news ${news.length} · gdelt ${links.length}${gd.error?` (${gd.error})`:''} · links ${ok.links.length}${retried?' · corrected':''}`:problems.length?`inconsistent: ${problems.join(' / ')}`:'rejected';
  return {...base,...(ok||fallbackBriefing({cur,changes})),note};
 }catch(e){return {...base,...fallbackBriefing({cur,changes}),note:`error ${e.message}`}}
}
