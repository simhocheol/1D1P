// Market pulse: big-picture asset groups, a pattern read from how they move together,
// and a plain-language summary. Public output carries levels only (no prices or statistics).

// sign: -1 flips a proxy so "up" means the group's own quantity rises (TLT price up = rates down).
// section: 'market' (financial markets) or 'commodity' (physical goods, shown together under 원자재).
export const pulseGroups=[
 {id:'stocks',section:'market',name:'주가',items:[['SPY',1],['QQQ',1],['IWM',1]],drivers:['demand','liquidity']},
 {id:'rates',section:'market',name:'국채 금리',items:[['TLT',-1],['IEF',-1]],drivers:['rates']},
 {id:'fear',section:'market',name:'공포지수',items:[['VIXY',1]],drivers:['credit','liquidity']},
 {id:'crypto',section:'market',name:'암호화폐',items:[['BTC/USD',1],['ETH/USD',1]],drivers:['liquidity','credit']},
 {id:'oil',section:'commodity',name:'유가',items:[['USO',1]],drivers:['cost','supply']},
 {id:'natgas',section:'commodity',name:'천연가스',items:[['UNG',1]],drivers:['cost','supply']},
 {id:'gold',section:'commodity',name:'금',items:[['GLD',1]],drivers:['fx','credit']},
 {id:'silver',section:'commodity',name:'은',items:[['SLV',1]],drivers:['cost','demand']},
 {id:'copper',section:'commodity',name:'구리',items:[['CPER',1]],drivers:['demand','investment']},
 {id:'grains',section:'commodity',name:'곡물',items:[['DBA',1],['CORN',1],['WEAT',1]],drivers:['cost','supply']},
];
export const pulseSymbols=[...new Set(pulseGroups.flatMap(g=>g.items.map(([s])=>s)))];

// Each pattern: required group directions. Score is the mean agreement; most conditions must agree.
export const patterns=[
 {id:'risk_off',name:'위험 회피',when:{stocks:-1,gold:1,fear:1,crypto:-1},text:'투자자들이 겁을 먹고 주식·암호화폐 같은 위험한 자산을 팔고, 금처럼 안전한 곳으로 돈을 옮기고 있어요.'},
 {id:'risk_on',name:'위험 선호',when:{stocks:1,fear:-1,crypto:1,gold:-1},text:'투자자들이 자신감을 보이며 주식·암호화폐처럼 위험하지만 수익을 기대할 수 있는 자산을 사고 있어요.'},
 {id:'inflation',name:'물가 걱정',when:{oil:1,rates:1,stocks:-1},text:'기름값과 금리가 함께 오르고 주가는 내려요. 물가가 다시 오를까 걱정하는 모습이에요.'},
 {id:'growth',name:'경기 기대',when:{copper:1,rates:1,stocks:1},text:'구리·금리·주가가 같이 올라요. 공장과 건설이 바빠질 거라, 즉 경기가 좋아질 거라 기대하는 모습이에요.'},
 {id:'easing',name:'금리 하락 기대',when:{rates:-1,stocks:1,crypto:1},text:'금리가 내려가고 주식·암호화폐가 올라요. 돈 빌리는 비용이 줄어들 거라 기대하는 모습이에요.'},
 {id:'slowdown',name:'경기 둔화 걱정',when:{rates:-1,copper:-1,stocks:-1},text:'금리·구리·주가가 함께 내려요. 경기가 식을까 걱정하는 모습이에요.'},
];
const calmText='큰 지표들이 대부분 평소 범위 안에서 움직였어요. 뚜렷한 방향이 없는 조용한 시장이에요.';
const mixedText='지표들이 서로 다른 방향으로 움직였어요. 시장이 한쪽으로 의견을 모으지 못한 모습이에요.';

const std=a=>{if(a.length<10)return null;const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))};
// Daily returns (%) from closes, used to scale today's move by how much the asset usually moves.
export function dailySigma(closes){const r=[];for(let i=1;i<closes.length;i++)if(closes[i-1]>0)r.push((closes[i]/closes[i-1]-1)*100);return std(r.slice(-60))}
export function level(z){if(!Number.isFinite(z))return null;return z>=1.5?2:z>=0.5?1:z<=-1.5?-2:z<=-0.5?-1:0}
export const levelText={2:'평소보다 크게 상승',1:'상승','0':'보합',[-1]:'하락',[-2]:'평소보다 크게 하락'};

// moves: {SYMBOL:{change:%, sigma:% daily}} → group z (mean of signed per-symbol z).
export function groupScores(moves){
 const out={};
 for(const g of pulseGroups){const zs=g.items.map(([s,sign])=>{const m=moves[s];return m&&Number.isFinite(m.change)&&m.sigma>0?sign*m.change/m.sigma:null}).filter(Number.isFinite);out[g.id]=zs.length?zs.reduce((a,b)=>a+b,0)/zs.length:null}
 return out;
}
export function detectPattern(z){
 const known=Object.values(z).filter(Number.isFinite);
 if(known.length<4)return {id:'unknown',name:'판정 보류',score:0,text:'지표 수집이 부족해 판정하지 않았어요.'};
 let best=null;
 for(const p of patterns){
  const conds=Object.entries(p.when).filter(([g])=>Number.isFinite(z[g]));if(conds.length<Object.keys(p.when).length-1)continue;
  const s=conds.map(([g,sign])=>z[g]*sign),agree=s.filter(v=>v>=0.3).length;
  if(agree<Math.ceil(conds.length*0.75)||s.some(v=>v<=-0.5))continue;
  const score=s.reduce((a,b)=>a+b,0)/s.length;if(score>=0.6&&(!best||score>best.score))best={id:p.id,name:p.name,score,text:p.text};
 }
 if(best)return best;
 if(known.every(v=>Math.abs(v)<0.5))return {id:'calm',name:'잔잔함',score:0,text:calmText};
 return {id:'mixed',name:'혼조',score:0,text:mixedText};
}
// Highlight the groups that moved most versus their usual range, in plain words.
export function leaders(z,n=2){return Object.entries(z).filter(([,v])=>Number.isFinite(v)&&Math.abs(v)>=1).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,n).map(([id,v])=>({id,level:level(v)}))}
export function summarize(pattern,lead){
 const name=id=>pulseGroups.find(g=>g.id===id).name;
 const tail=lead.length?` 가장 눈에 띈 움직임은 ${lead.map(l=>`${name(l.id)}(${levelText[l.level]})`).join(', ')}이에요.`:'';
 return pattern.text+tail;
}
export function etSession(at){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(at).map(x=>[x.type,x.value]));
 // Overnight (day-market) session runs 20:00-04:00 ET from Sunday night to Friday morning.
 const t=+p.hour*60+ +p.minute,d=p.weekday;
 if(d==='Sat')return 'closed';if(d==='Sun')return t>=1200?'overnight':'closed';
 if(t<240)return 'overnight';
 if(t>=1200)return d==='Fri'?'closed':'overnight';
 return t<570?'pre':t<960?'regular':'after';
}
// One accumulated record. Only levels and pattern ids are published.
export function buildPulse({moves,at=new Date()}){
 const z=groupScores(moves),pattern=detectPattern(z),lead=leaders(z);
 return {at:at.toISOString(),session:etSession(at),pattern:{id:pattern.id,name:pattern.name},summary:summarize(pattern,lead),
  groups:Object.fromEntries(pulseGroups.map(g=>[g.id,level(z[g.id])])),lead:lead.map(l=>l.id)};
}
export function appendPulse(history,pulse,keepDays=120){
 const cutoff=Date.parse(pulse.at)-keepDays*86400000;
 const items=[...(history?.items||[]).filter(i=>Date.parse(i.at)>=cutoff&&i.at!==pulse.at),pulse].sort((a,b)=>a.at.localeCompare(b.at));
 // Keep explanations for a week only so the public history stays small.
 const whyCut=Date.parse(pulse.at)-7*86400000;for(const i of items)if(i.why&&Date.parse(i.at)<whyCut)delete i.why;
 return {version:1,updatedAt:pulse.at,items};
}
