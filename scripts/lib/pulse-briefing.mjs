// Hourly briefing: card changes since the previous pulse, explained with recent market news via OpenAI.
import {pickModel,recentNews} from './pulse-why.mjs';
import {gdeltArticles} from './gdelt.mjs';
import {cardChanges,briefingNews,briefingSchema,briefingPrompt,validateBriefing,fallbackBriefing} from '../../server/pulse-briefing.js';
export async function buildBriefing({cur,prev,alpacaHeaders,openaiKey,flows=[]}){
 const changes=cardChanges(cur,prev);
 const base={at:cur.at,session:cur.session,pattern:cur.pattern,changed:changes.changed,notable:changes.notable,flows};
 if(!openaiKey)return {...base,...fallbackBriefing({cur,changes}),note:'no-openai-key'};
 try{
  const ids=[...new Set([...changes.changed.map(c=>c.id),...changes.notable])];
  const [model,all,gd]=await Promise.all([pickModel(openaiKey),recentNews(alpacaHeaders),gdeltArticles(ids)]);const links=gd.articles.slice(0,25);
  const news=briefingNews(all,ids.length?ids:['stocks','rates']);
  if(news.length<2)return {...base,...fallbackBriefing({cur,changes}),note:'few-news'};
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${openaiKey}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(120000),
   body:JSON.stringify({model,response_format:{type:'json_schema',json_schema:{name:'pulse_briefing',strict:true,schema:briefingSchema}},messages:briefingPrompt({session:cur.session,cur,changes,news,links,flows})})});
  if(!r.ok)throw Error(`chat HTTP ${r.status}`);
  const ok=validateBriefing(JSON.parse((await r.json()).choices[0].message.content),news,links);
  return {...base,...(ok||fallbackBriefing({cur,changes})),note:ok?`model ${model} · news ${news.length} · gdelt ${links.length}${gd.error?` (${gd.error})`:''} · links ${ok.links.length}`:'rejected'};
 }catch(e){return {...base,...fallbackBriefing({cur,changes}),note:`error ${e.message}`}}
}
