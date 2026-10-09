// Hourly AI briefing for the market pulse: which cards changed since the last check and why.
// Public output: title, bullets, changed card ids and source counts (no headlines, links, prices or quotes).
import {pulseGroups,levelText} from './market-pulse.js';
import {keywords} from './pulse-why.js';
import {flowSummary,flowClasses} from './fund-flow.js';
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
export const briefingSchema={type:'object',additionalProperties:false,required:['confident','title','bullets','news_ids','link_ids','claims'],properties:{
 claims:{type:'array',items:{type:'object',additionalProperties:false,required:['target','direction'],properties:{target:{type:'string',enum:[...pulseGroups.map(g=>g.id),...flowClasses.map(c=>`flow:${c.id}`)]},direction:{type:'string',enum:['up','down','flat','in','out']}}}},
 confident:{type:'boolean'},title:{type:'string'},bullets:{type:'array',items:{type:'string'}},news_ids:{type:'array',items:{type:'integer'}},link_ids:{type:'array',items:{type:'integer'}}}};
export function briefingPrompt({session,cur,changes,news,links=[],flows=[]}){
 const ids=`카드 id: ${pulseGroups.map(g=>`${g.id}=${g.name}`).join(', ')} / 자금 흐름 id: ${flowClasses.map(c=>`flow:${c.id}=${c.label}`).join(', ')}`;
 const now=pulseGroups.filter(g=>Number.isFinite(cur.groups[g.id])).map(g=>`${g.name} ${levelText[cur.groups[g.id]]}`).join(', ');
 const moved=changes.changed.map(c=>`${name(c.id)}: ${levelText[c.from]} → ${levelText[c.to]}`).join(', ')||'없음';
 return [{role:'system',content:'너는 경제를 잘 모르는 사람에게 미국 시장 흐름을 매시간 브리핑하는 한국어 해설가야. 주어진 카드 상태와 뉴스만 근거로 써. 숫자·가격·퍼센트는 쓰지 마. 추측이나 투자 권유는 하지 마. 개별 회사 소식은 시장 전체의 이유로 쓰지 마.'},
  {role:'user',content:`시간대: ${sessionTag[session]}\n전체 분위기 판정: ${cur.pattern.name}\n지금 카드 상태(평소 하루 변동폭 대비): ${now}\n지난 확인 이후 바뀐 카드: ${moved}\n자금 흐름(지난 1시간, 같은 시각 평소 거래량 대비): ${flowSummary(flows)||'자료 없음'}\n${ids}\n주의: 카드 상태와 자금 흐름에 없는 방향은 쓰지 마. 보합인 카드를 오르거나 내렸다고, 자료가 없는 자산군에 돈이 들어오거나 나갔다고 쓰지 마.\n\n뉴스(번호. 제목 — 요약):\n${news.map((n,i)=>`${i}. ${n.title} — ${(n.summary||'').slice(0,280)}`).join('\n')||'(없음)'}\n\n공개 기사(번호. 매체 — 제목):\n${links.map((a,i)=>`${i}. ${a.domain} — ${a.title}`).join('\n')||'(없음)'}\n\n다음을 JSON으로 답해:\n- title: "유가·금리 부담에 미국 약세"처럼 지금 흐름을 담은 30자 안팎 제목\n- bullets: 정확히 3문장. 첫 문장은 어떤 카드가 어떻게 변했는지, 근거 번호는 문장에 쓰지 말고, 나머지는 자금이 어디서 어디로 움직였는지와 그 이유를 뉴스 근거로 쉬운 말("~했어요/~예요" 체, 각 90자 이내)로\n- news_ids: 이유의 근거로 쓴 뉴스 번호\n- claims: 제목과 문장에서 카드나 자금 흐름에 대해 말한 모든 방향 주장. 카드는 target=카드 id, direction=up/down/flat. 자금 흐름은 target=flow:자산군 id, direction=in/out/flat\n- link_ids: 공개 기사 중 이 브리핑과 직접 관련된 기사 번호(최대 3개, 관련 없으면 빈 배열)\n- confident: 뉴스가 변화를 설명하면 true`}];
}
// Backstop for claims the model forgot to declare: card name followed closely by a direction word.
// 금 must not match 금리, and 은 only as the metal (followed by a particle like ·/과/이/가/값/가격).
const cardWords={stocks:'주가|증시|주식',rates:'금리|국채 금리',fear:'공포지수|VIX',crypto:'암호화폐|가상자산|비트코인',oil:'유가|원유',natgas:'천연가스',gold:'금(?!리|융|요|액|지)',silver:'은(?=[·과와이가값 ]|\\s*가격)',copper:'구리',grains:'곡물|밀|옥수수'};
const upW='오르|올랐|올라|상승|강세|뛰',downW='내리|내렸|내려|하락|약세|밀렸|떨어';
export function textClaims(text){
 const out=[];for(const [id,w] of Object.entries(cardWords)){const re=new RegExp(`(?:${w})[^.,]{0,8}?(${upW}|${downW})`,'g');let m;
  while((m=re.exec(text))){out.push({target:id,direction:new RegExp(upW).test(m[1])?'up':'down'})}}
 // Money-flow phrases: "금·은으로 자금이 옮겨갔어요", "주식에서 돈이 빠졌어요".
 const flowWords={stocks:'주식|증시',bonds:'채권|국채',commodities:'원자재|금(?!리|융)|은(?=[·과와])|구리|원유',dollar:'달러',crypto:'가상자산|암호화폐|비트코인'};
 for(const [id,w] of Object.entries(flowWords)){
  const inRe=new RegExp(`(?:${w})[^.]{0,6}?(?:으로|로|에)[^.]{0,10}?(?:옮겨|몰렸|몰리|유입|들어)`),outRe=new RegExp(`(?:${w})[^.]{0,6}?(?:에서)[^.]{0,10}?(?:빠|유출|이탈)`);
  if(inRe.test(text))out.push({target:`flow:${id}`,direction:'in'});if(outRe.test(text))out.push({target:`flow:${id}`,direction:'out'});
 }
 return out;
}
// Checks each declared claim against the card levels and the money flow. Returns readable problems.
export function claimProblems(claims,cur,flows=[]){
 const out=[];
 for(const c of claims||[]){
  if(c.target.startsWith('flow:')){const f=flows.find(x=>`flow:${x.id}`===c.target),label=flowClasses.find(x=>`flow:${x.id}`===c.target)?.label;
   if(!f?.dir){if(c.direction!=='flat')out.push(`${label} 자금 흐름은 지난 1시간 자료가 없어요`);continue}
   const want=c.direction==='up'?'in':c.direction==='down'?'out':c.direction;if(want!==f.dir)out.push(`${label} 자금 흐름은 실제로 "${f.dir==='in'?'유입':f.dir==='out'?'유출':'정체'}"이에요`);continue}
  const v=cur.groups?.[c.target];const n=name(c.target);
  if(!Number.isFinite(v)){out.push(`${n} 카드는 이번에 판정 자료가 없어요`);continue}
  const actual=v>=1?'up':v<=-1?'down':'flat',want=c.direction==='in'?'up':c.direction==='out'?'down':c.direction;
  if(want!==actual)out.push(`${n} 카드는 실제로 "${levelText[v]}"이에요`);
 }
 return out;
}
// Removes internal reference markers like "(기사4)" or "(뉴스 2, 19)" that the model sometimes copies into text.
const clean=s=>String(s||'').replace(/\s*[(（\[](?:기사|뉴스|공개 기사)\s*\d+(?:\s*[,·]\s*(?:기사|뉴스)?\s*\d+)*[)）\]]/g,'').replace(/\s+/g,' ').trim();
const hasFigure=t=>/\d+(\.\d+)?\s*(%|달러|원|엔|포인트|bp|bps)/i.test(t);
// Deterministic briefing when there is no key, no news, or the model output fails validation.
export function fallbackBriefing({cur,changes}){
 const up=changes.notable.filter(id=>cur.groups[id]>0).map(name),down=changes.notable.filter(id=>cur.groups[id]<0).map(name);
 const moved=changes.changed.map(c=>`${name(c.id)}(${levelText[c.from]}→${levelText[c.to]})`);
 const title=up.length||down.length?`${[up.length&&`${up.slice(0,2).join('·')} 상승`,down.length&&`${down.slice(0,2).join('·')} 하락`].filter(Boolean).join(', ')}`:'큰 움직임 없는 시장';
 return {title,bullets:[moved.length?`지난 확인 이후 ${moved.join(', ')}로 바뀌었어요.`:'지난 확인 이후 카드 상태에 큰 변화는 없었어요.',`지금 분위기는 “${cur.pattern.name}”이에요. ${cur.summary.split('. ')[0].replace(/\.$/,'')}.`,'이 변화를 설명하는 시장 뉴스는 아직 충분하지 않아요.'],sources:{count:0,publishers:[]},ai:false};
}
export function validateBriefing(raw,news,links=[]){
 if(!raw||raw.confident!==true)return null;
 const ids=[...new Set((raw.news_ids||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<news.length))];if(ids.length<2)return null;
 const title=clean(raw.title).slice(0,50),bullets=(raw.bullets||[]).map(clean).filter(b=>b&&b.length<=140).slice(0,3);
 if(!title||bullets.length<3||[title,...bullets].some(hasFigure))return null;
 const used=ids.map(i=>news[i]);
 const related=[...new Set((raw.link_ids||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<links.length))].slice(0,3).map(i=>links[i]);
 return {title,bullets,sources:{count:used.length,publishers:[...new Set(used.map(n=>n.source).filter(Boolean))].slice(0,4)},links:related,ai:true};
}
// Two weeks of hourly briefings (the history modal browses them by day).
export function appendBriefing(file,item,keep=24*14){const items=[...(file?.items||[]).filter(i=>i.at!==item.at),item].sort((a,b)=>a.at.localeCompare(b.at)).slice(-keep);return {version:1,updatedAt:item.at,items}}
