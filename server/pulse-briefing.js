// Hourly AI briefing for the market pulse: which cards changed since the last check and why.
// Public output: title, bullets, changed card ids and source counts (no headlines, links, prices or quotes).
import {pulseGroups,levelText} from './market-pulse.js';
import {keywords} from './pulse-why.js';
const name=id=>pulseGroups.find(g=>g.id===id)?.name||id;
export const sessionTag={pre:'장 시작 전',regular:'정규장',after:'장 마감 후',overnight:'데이장',closed:'휴장'};
// Card-level changes between two pulses, plus cards that are notably moving now.
export function cardChanges(cur,prev){
 const changed=[],notable=[];
 for(const g of pulseGroups){const a=prev?.groups?.[g.id],b=cur.groups[g.id];if(!Number.isFinite(b))continue;
  if(Number.isFinite(a)&&a!==b)changed.push({id:g.id,from:a,to:b});if(Math.abs(b)>=1)notable.push(g.id)}
 return {changed,notable};
}
// Market-level stories that touch the cards in play, newest first.
export function briefingNews(news,ids,limit=20){
 const kws=[...new Set(ids.flatMap(id=>keywords[id]||[]))];const syms=new Set(pulseGroups.filter(g=>ids.includes(g.id)).flatMap(g=>g.items.map(([s])=>s.replace('/',''))));
 const market=n=>(n.symbols||[]).some(x=>syms.has(x))||(n.symbols||[]).length===0||(n.symbols||[]).length>=4;
 return news.filter(n=>market(n)&&((n.symbols||[]).some(x=>syms.has(x))||kws.some(k=>`${n.title} ${n.summary}`.toLowerCase().includes(k)))).slice(0,limit);
}
export const briefingSchema={type:'object',additionalProperties:false,required:['confident','title','bullets','news_ids'],properties:{
 confident:{type:'boolean'},title:{type:'string'},bullets:{type:'array',items:{type:'string'}},news_ids:{type:'array',items:{type:'integer'}}}};
export function briefingPrompt({session,cur,changes,news}){
 const now=pulseGroups.filter(g=>Number.isFinite(cur.groups[g.id])).map(g=>`${g.name} ${levelText[cur.groups[g.id]]}`).join(', ');
 const moved=changes.changed.map(c=>`${name(c.id)}: ${levelText[c.from]} → ${levelText[c.to]}`).join(', ')||'없음';
 return [{role:'system',content:'너는 경제를 잘 모르는 사람에게 미국 시장 흐름을 매시간 브리핑하는 한국어 해설가야. 주어진 카드 상태와 뉴스만 근거로 써. 숫자·가격·퍼센트는 쓰지 마. 추측이나 투자 권유는 하지 마. 개별 회사 소식은 시장 전체의 이유로 쓰지 마.'},
  {role:'user',content:`시간대: ${sessionTag[session]}\n전체 분위기 판정: ${cur.pattern.name}\n지금 카드 상태(평소 하루 변동폭 대비): ${now}\n지난 확인 이후 바뀐 카드: ${moved}\n\n뉴스(번호. 제목 — 요약):\n${news.map((n,i)=>`${i}. ${n.title} — ${(n.summary||'').slice(0,280)}`).join('\n')||'(없음)'}\n\n다음을 JSON으로 답해:\n- title: "유가·금리 부담에 미국 약세"처럼 지금 흐름을 담은 30자 안팎 제목\n- bullets: 정확히 3문장. 첫 문장은 어떤 카드가 어떻게 변했는지, 나머지는 그 이유를 뉴스 근거로 쉬운 말("~했어요/~예요" 체, 각 90자 이내)로\n- news_ids: 이유의 근거로 쓴 뉴스 번호\n- confident: 뉴스가 변화를 설명하면 true`}];
}
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const hasFigure=t=>/\d+(\.\d+)?\s*(%|달러|원|엔|포인트|bp|bps)/i.test(t);
// Deterministic briefing when there is no key, no news, or the model output fails validation.
export function fallbackBriefing({cur,changes}){
 const up=changes.notable.filter(id=>cur.groups[id]>0).map(name),down=changes.notable.filter(id=>cur.groups[id]<0).map(name);
 const moved=changes.changed.map(c=>`${name(c.id)}(${levelText[c.from]}→${levelText[c.to]})`);
 const title=up.length||down.length?`${[up.length&&`${up.slice(0,2).join('·')} 상승`,down.length&&`${down.slice(0,2).join('·')} 하락`].filter(Boolean).join(', ')}`:'큰 움직임 없는 시장';
 return {title,bullets:[moved.length?`지난 확인 이후 ${moved.join(', ')}로 바뀌었어요.`:'지난 확인 이후 카드 상태에 큰 변화는 없었어요.',`지금 분위기는 “${cur.pattern.name}”이에요. ${cur.summary.split('. ')[0].replace(/\.$/,'')}.`,'이 변화를 설명하는 시장 뉴스는 아직 충분하지 않아요.'],sources:{count:0,publishers:[]},ai:false};
}
export function validateBriefing(raw,news){
 if(!raw||raw.confident!==true)return null;
 const ids=[...new Set((raw.news_ids||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<news.length))];if(ids.length<2)return null;
 const title=clean(raw.title).slice(0,50),bullets=(raw.bullets||[]).map(clean).filter(b=>b&&b.length<=140).slice(0,3);
 if(!title||bullets.length<3||[title,...bullets].some(hasFigure))return null;
 const used=ids.map(i=>news[i]);
 return {title,bullets,sources:{count:used.length,publishers:[...new Set(used.map(n=>n.source).filter(Boolean))].slice(0,4)},ai:true};
}
export function appendBriefing(file,item,keep=72){const items=[...(file?.items||[]).filter(i=>i.at!==item.at),item].sort((a,b)=>a.at.localeCompare(b.at)).slice(-keep);return {version:1,updatedAt:item.at,items}}
