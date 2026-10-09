// "Why did it move?" cards for the market pulse: picks groups that moved notably, matches recent news
// by keyword, and validates an OpenAI summary. Public output: title, bullets, tags and source counts only
// (no headlines, links, prices or quotes).
import {pulseGroups,levelText} from './market-pulse.js';
export const keywords={
 stocks:['stock','s&p','nasdaq','dow','equit','wall street','shares'],
 rates:['treasury','yield','bond','fed ','federal reserve','rate cut','rate hike','powell'],
 fear:['volatil','vix','selloff','sell-off','fear','panic'],
 crypto:['bitcoin','crypto','ether','btc','eth ','stablecoin'],
 oil:['oil','crude','opec','brent','wti'],
 natgas:['natural gas','lng','gas price','henry hub'],
 gold:['gold','bullion','precious metal'],
 silver:['silver','precious metal'],
 copper:['copper','industrial metal','base metal'],
 grains:['wheat','corn','soybean','grain','crop','agricultur','usda'],
};
// Groups worth explaining: moved at least "상승/하락", strongest first, at most n.
export function pickMovers(groups,n=3){return Object.entries(groups).filter(([,v])=>Number.isFinite(v)&&Math.abs(v)>=1).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,n).map(([id,level])=>({id,level}))}
export function matchNews(groupId,news,limit=12){
 const kw=keywords[groupId]||[];const g=pulseGroups.find(x=>x.id===groupId);const syms=new Set((g?.items||[]).map(([s])=>s.replace('/','')));
 // Market-level stories only: tagged with the group's own proxies, or untagged / tagged with few symbols.
 // A story about one company (e.g. a gold miner's output) does not explain the commodity or the index.
 const marketLevel=n=>(n.symbols||[]).some(x=>syms.has(x))||(n.symbols||[]).length===0||(n.symbols||[]).length>=4;
 return news.filter(n=>marketLevel(n)&&((n.symbols||[]).some(x=>syms.has(x))||kw.some(k=>`${n.title} ${n.summary}`.toLowerCase().includes(k)))).slice(0,limit);
}
export const whySchema={type:'object',additionalProperties:false,required:['confident','title','bullets','tags','news_ids'],properties:{
 confident:{type:'boolean'},title:{type:'string'},bullets:{type:'array',items:{type:'string'}},tags:{type:'array',items:{type:'string'}},news_ids:{type:'array',items:{type:'integer'}}}};
export function whyPrompt({group,level,context,news}){
 const g=pulseGroups.find(x=>x.id===group);
 return [{role:'system',content:'너는 경제를 잘 모르는 사람에게 시장 움직임을 설명하는 한국어 해설가야. 주어진 뉴스와 지표만 근거로 써. 숫자·가격·퍼센트는 쓰지 마. 추측이나 투자 권유는 하지 마. 개별 회사의 실적·생산·증권사 의견은 시장 전체나 원자재 가격의 이유로 쓰지 마. 근거 뉴스가 이 움직임을 설명하지 못하면 confident=false로 답해.'},
  {role:'user',content:`대상: ${g.name} (${levelText[level]})\n다른 지표: ${context}\n\n뉴스(번호. 제목 — 요약):\n${news.map((n,i)=>`${i}. ${n.title} — ${(n.summary||'').slice(0,300)}`).join('\n')}\n\n다음을 JSON으로 답해:\n- title: "달러 약세로 금 상승"처럼 원인과 움직임을 담은 20자 안팎 제목\n- bullets: 움직임의 원인을 쉬운 말로 설명하는 2~3문장(각 80자 이내, "~했어요/~예요" 체). 다른 지표를 나열하지 말고 원인만 써\n- tags: 원인 키워드 2~3개(각 8자 이내)\n- news_ids: 근거로 쓴 뉴스 번호\n- confident: 뉴스가 움직임을 설명하면 true`}];
}
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
// Rejects anything unsupported or containing figures so licensed prices never leak into public text.
export function validateWhy(raw,news,group,level){
 if(!raw||raw.confident!==true)return null;
 const ids=[...new Set((raw.news_ids||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<news.length))];if(ids.length<2)return null; // one story is not enough to explain a market move
 const bullets=(raw.bullets||[]).map(clean).filter(b=>b&&b.length<=120).slice(0,3),tags=(raw.tags||[]).map(clean).filter(t=>t&&t.length<=10).slice(0,3),title=clean(raw.title).slice(0,40);
 if(!title||bullets.length<2)return null;
 if([title,...bullets].some(t=>/\d+(\.\d+)?\s*(%|달러|원|포인트|bp)/i.test(t)))return null;
 const used=ids.map(i=>news[i]);
 return {group,level,title,bullets,tags,sources:{count:used.length,publishers:[...new Set(used.map(n=>n.source).filter(Boolean))].slice(0,4)},latest:used.map(n=>n.publishedAt).sort().at(-1)||null};
}
