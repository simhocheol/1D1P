import React,{useEffect,useState} from 'react';
import {TrendingUp,TrendingDown,Minus,ChevronsUp,ChevronsDown,Activity,ChevronRight,ChevronLeft,Sparkles} from 'lucide-react';
import {pulseGroups,patterns,levelText} from '../server/market-pulse.js';
import InfoModal,{DriverTags,Section} from './info-modal.jsx';
import {Card} from './market-context.jsx';
import {quoteTabs,QuoteCard,BondCard} from './quote-cards.jsx';
import {volText,flowText,pressureText} from '../server/fund-flow.js';
const sessionName={pre:'장 시작 전',regular:'정규장',after:'장 마감 후',closed:'휴장',overnight:'데이장'};
const LevelIcon=({v})=>v===2?<ChevronsUp size={15}/>:v===1?<TrendingUp size={15}/>:v===-1?<TrendingDown size={15}/>:v===-2?<ChevronsDown size={15}/>:<Minus size={15}/>;
const kstTime=at=>new Date(at).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit'});
const kstStamp=at=>new Date(at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
const publisherName={benzinga:'Benzinga',reuters:'Reuters',bloomberg:'Bloomberg'};
const json=url=>fetch(url,{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null);
// Related public articles (GDELT): outlet, headline, original link.
const Related=({links})=>links?.length>0&&<div className="brief-links"><span>관련 뉴스</span>{links.map(l=><a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"><b>{l.domain}</b>{l.title}</a>)}</div>;
// Money flow by asset class over the last hour (stages only). Crypto strength is real taker data;
// the others infer direction from price and volume together.
function Flows({flows,compact}){
 if(!flows?.length)return null;
 return <div className={`flows ${compact?'compact':''}`}><span className="flows-title">자금 흐름 · 지난 1시간</span>{flows.map(f=><div key={f.id} className={`flow flow-${f.dir||'none'}`}><strong>{f.label}</strong><em>{f.dir==='in'?'▲':f.dir==='out'?'▼':'–'} {f.dir?flowText[f.dir]:'거래 없음'}</em>{f.dir&&<span>{volText[f.vol]}{f.pressure?` · ${pressureText[f.pressure]}`:''}{f.lead?` · ${f.lead} 중심`:''}</span>}</div>)}</div>;
}
// Hourly AI briefing: which cards changed since the previous check and why.
function Briefing({b,onHistory}){
 if(!b)return <p className="fine">아직 브리핑이 없어요. 매시간 갱신돼요.</p>;
 return <section className="brief" aria-label="AI 브리핑"><header><span className="brief-kicker"><Sparkles size={16}/>AI 브리핑</span><h3><span className="brief-tag">[{sessionName[b.session]}]</span> {b.title}</h3><button type="button" className="brief-time" onClick={onHistory} aria-haspopup="dialog">{kstStamp(b.at)}<ChevronRight size={14}/></button></header>
  <ul>{b.bullets.map((x,i)=><li key={i}>{x}</li>)}</ul>
  <Flows flows={b.flows}/>
  <Related links={b.links}/>
  <p className="brief-foot">분위기 판정 · {b.pattern?.name}{b.sources.count>0?` · ${b.sources.count}개 출처(${b.sources.publishers.map(p=>publisherName[p]||p).join(', ')})`:''} · {b.ai?'OpenAI 요약':'자동 정리(근거 뉴스 부족)'}</p>
 </section>;
}
const kstDay=at=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date(at));
// Briefing history like a news timeline: one day at a time, newest first, two weeks back.
function BriefingHistory({items}){
 const days=[...new Set(items.map(i=>kstDay(i.at)))].sort().reverse(),[day,setDay]=useState(days[0]),idx=days.indexOf(day),latest=items.at(-1)?.at;
 const list=items.filter(i=>kstDay(i.at)===day).reverse();
 return <div className="bh"><p className="bh-note"><Sparkles size={15}/><b>AI</b> 미국 시장 카드의 변화와 관련 뉴스를 생성형 AI로 요약해요.</p>
  <div className="bh-nav"><button type="button" aria-label="이전 날" disabled={idx>=days.length-1} onClick={()=>setDay(days[idx+1])}><ChevronLeft size={18}/></button><strong>{day?.replaceAll('-','. ')}.</strong><button type="button" aria-label="다음 날" disabled={idx<=0} onClick={()=>setDay(days[idx-1])}><ChevronRight size={18}/></button><small>최신 생성일 기준으로 최대 2주 전까지 볼 수 있어요.</small></div>
  {list.map(b=><article key={b.at} className={`bh-row ${b.at===latest?'is-new':''}`}><div className="bh-time">{new Date(b.at).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false})}{b.at===latest&&<em>NEW</em>}</div><div><h4><span className="brief-tag">[{sessionName[b.session]}]</span> {b.title}</h4><ul>{b.bullets.map((x,i)=><li key={i}>{x}</li>)}</ul><Flows flows={b.flows} compact/><Related links={b.links}/></div></article>)}
 </div>;
}
export default function MarketPulse(){
 const [history,setHistory]=useState(null),[brief,setBrief]=useState(null),[context,setContext]=useState(null),[tab,setTab]=useState(quoteTabs[0].id),[modal,setModal]=useState(null);
 useEffect(()=>{json('/data/pulse/history.json').then(setHistory);json('/data/pulse/briefing.json').then(setBrief);json('/data/context.json').then(setContext)},[]);
 const items=history?.items||[],cur=items.at(-1),briefs=brief?.items||[],latest=briefs.at(-1);
 const active=quoteTabs.find(t=>t.id===tab);
 const group=modal?.group&&pulseGroups.find(g=>g.id===modal.group);
 return <Card icon={Activity} title="시장 분위기" sub="실시간 시세 카드와 매시간 AI 브리핑" meta={cur&&`판정 ${kstTime(cur.at)} · ${sessionName[cur.session]}`} className="pulse-main">
  <Briefing b={latest} onHistory={()=>setModal({briefs:true})}/>
  <div className="quote-tabs" role="tablist" aria-label="시세 분류">{quoteTabs.map(t=><button key={t.id} type="button" role="tab" aria-selected={tab===t.id} className={tab===t.id?'is-active':''} onClick={()=>setTab(t.id)}>{t.label}</button>)}</div>
  {active.sections.map(sec=><div key={sec.label} className="quote-section"><h3>{sec.label}</h3><div className={`quote-grid ${sec.cols?`cols-${sec.cols}`:''}`}>
   {sec.bonds?(context?.bonds||[]).map(b=><BondCard key={b.id} bond={b}/>):sec.items.map(q=><QuoteCard key={q.symbol} {...q}/>)}
  </div></div>)}
  <p className="fine">{active.note}</p>
  {cur&&<div className="pulse-judge"><span>카드 판정</span>{pulseGroups.map(g=>{const v=cur.groups[g.id];return <button type="button" key={g.id} onClick={()=>setModal({group:g.id})} className={`pulse-pill lv${v??'na'} ${g.id==='fear'?'inverse':''}`} aria-haspopup="dialog">{g.name}<LevelIcon v={v}/></button>})}<button type="button" className="home-link" onClick={()=>setModal({how:true})}>판정 기준</button></div>}
  <InfoModal open={modal} onClose={()=>setModal(null)} title={modal?.briefs?'AI 브리핑':modal?.how?'카드 판정 기준':group?.name}>
   {modal?.briefs&&<BriefingHistory items={briefs}/>}
   {modal?.how&&<><Section><p>카드마다 대리 ETF의 움직임을 최근 60거래일의 평소 하루 변동폭과 비교해 상승·하락 단계를 매겨요. 여러 카드가 함께 움직이는 모양이 아래 패턴과 맞으면 분위기 이름을 붙여요. 매시간 판정하고, 바뀐 카드를 AI 브리핑이 설명해요.</p><ul>{patterns.map(p=><li key={p.id}><b>{p.name}</b> · {Object.entries(p.when).map(([g,s])=>`${pulseGroups.find(x=>x.id===g).name}${s>0?'↑':'↓'}`).join(' ')}</li>)}</ul></Section></>}
   {group&&cur&&<><Section title="지금"><p className="info-big"><LevelIcon v={cur.groups[group.id]}/> {cur.groups[group.id]==null?(cur.session==='overnight'?'데이장 거래 없음':'미수집'):levelText[cur.groups[group.id]]}</p></Section>
    <Section title="최근 기록"><div className="pulse-trail">{items.slice(-24).map(i=><span key={i.at} title={kstStamp(i.at)} className={`pulse-group lv${i.groups[group.id]??'na'} ${group.id==='fear'?'inverse':''}`}><LevelIcon v={i.groups[group.id]}/></span>)}</div><p className="fine">왼쪽이 오래된 기록, 오른쪽이 최신이에요. 대리지표 · {group.items.map(([s,sign])=>sign<0?`${s}(반대 방향)`:s).join(' · ')}</p></Section>
    <Section title="연결된 Driver"><DriverTags ids={group.drivers}/></Section></>}
  </InfoModal>
 </Card>;
}
