// Fetches recent news (Alpaca) and asks OpenAI why the biggest pulse movers moved. Runs during collection only.
import {pulseGroups,levelText} from '../../server/market-pulse.js';
import {pickMovers,matchNews,whySchema,whyPrompt,validateWhy} from '../../server/pulse-why.js';
const PREFERRED=['gpt-5.5-mini','gpt-5-mini','gpt-4.1-mini','gpt-4o-mini'];
async function pickModel(key){
 const r=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error(`models HTTP ${r.status}`);const ids=(await r.json()).data.map(m=>m.id);
 return PREFERRED.find(m=>ids.includes(m))||ids.find(i=>/^gpt-.*mini$/.test(i));
}
async function recentNews(headers){
 const out=[],syms=[...new Set(pulseGroups.flatMap(g=>g.items.map(([s])=>s.replace('/',''))))];
 // Market-wide news plus news tagged with the pulse ETFs, last 24 hours.
 for(const symbols of [null,syms.join(',')]){let token;
  for(let page=0;page<3;page++){const u=new URL('https://data.alpaca.markets/v1beta1/news');u.search=new URLSearchParams({start:new Date(Date.now()-864e5).toISOString(),limit:'50',sort:'desc',include_content:'false',...(symbols?{symbols}:{}),...(token?{page_token:token}:{})}).toString();
   const r=await fetch(u,{headers,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`news HTTP ${r.status}`);const d=await r.json();
   for(const n of d.news||[])out.push({id:n.id,title:n.headline,summary:n.summary||'',symbols:n.symbols||[],source:n.source,publishedAt:n.created_at});
   token=d.next_page_token;if(!token)break}}
 return [...new Map(out.map(n=>[n.id,n])).values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
}
export async function explainMovers({groups,alpacaHeaders,openaiKey}){
 const movers=pickMovers(groups);if(!movers.length||!openaiKey)return {cards:[],note:movers.length?'no-openai-key':'no-movers'};
 const [model,news]=await Promise.all([pickModel(openaiKey),recentNews(alpacaHeaders)]);
 const context=pulseGroups.filter(g=>Number.isFinite(groups[g.id])).map(g=>`${g.name} ${levelText[groups[g.id]]}`).join(', ');
 const cards=[],errors=[];
 for(const {id,level} of movers){
  const matched=matchNews(id,news);if(matched.length<2)continue;
  try{
   const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${openaiKey}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(120000),
    body:JSON.stringify({model,response_format:{type:'json_schema',json_schema:{name:'pulse_why',strict:true,schema:whySchema}},messages:whyPrompt({group:id,level,context,news:matched})})});
   if(!r.ok)throw Error(`chat HTTP ${r.status}`);
   const card=validateWhy(JSON.parse((await r.json()).choices[0].message.content),matched,id,level);if(card)cards.push(card);
  }catch(e){errors.push(`${id}: ${e.message}`)}
 }
 return {cards,model,news:news.length,errors};
}
