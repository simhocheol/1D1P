import React,{useState} from 'react';
import {ArrowUpRight,Globe} from 'lucide-react';
import {DriverArt} from './driver-icons.jsx';
import DriverModal from './driver-modal.jsx';
const sectorNames={'Information Technology':'정보기술',Financials:'금융',Energy:'에너지','Health Care':'헬스케어','Consumer Discretionary':'경기소비재','Consumer Staples':'필수소비재',Industrials:'산업재',Materials:'소재',Utilities:'유틸리티','Real Estate':'부동산','Communication Services':'커뮤니케이션'};
const label=s=>sectorNames[s]||s;
const pct=v=>Number.isFinite(v)?`${v>0?'+':''}${v.toFixed(1)}%`:'—';
const tone=v=>v>0?'positive':v<0?'negative':'';
const layerName=l=>l==='macro'?'거시':l==='industry'?'산업·정책':'기업';
const statusName=s=>s==='observed'?'관측됨':s==='quiet'?'기준 미달':'미확인';
function sourceLine(d){const s=d.sources,parts=[];if(s.fred.length)parts.push(`FRED ${s.fred.join(', ')}`);if(s.proxy)parts.push(`${s.proxy} 대리지표`);if(s.filings)parts.push(`SEC 공시 ${s.filings}건`);if(s.news)parts.push(`뉴스 ${s.news}건`);return parts.join(' · ')||'확인 가능한 관측 자료 없음'}
export default function PublicReport({report}){
 const [open,setOpen]=useState('');const [driver,setDriver]=useState('');
 const name=id=>report.drivers.find(d=>d.id===id)?.name||id;
 const sectors=[...report.sectors].sort((a,b)=>(a.relative??a.change??0)-(b.relative??b.change??0));
 const scale=Math.max(0.5,...sectors.map(s=>Math.abs(s.relative??s.change??0)));
 const candidates=report.candidates.filter(c=>!driver||c.paths.some(p=>p.driverId===driver));
 const od=report.drivers.find(d=>d.id===open);
 return <div className="report-workspace public-report">
  <p className="report-basis"><Globe size={12}/> 공개 요약 · {report.session==='pre'?'09:15 ET 프리마켓 · 전일 종가 대비':'종가 · 전일 종가 대비'} · {new Date(report.generatedAt).toLocaleString('ko-KR')} 생성</p>
  <div className="report-strip"><span className="rail-label">DAILY RESEARCH</span><div><span>관측된 Driver</span><strong>{report.summary.observed} / 12</strong></div><div><span>연결된 섹터</span><strong>{report.summary.sectors}</strong></div><div><span>판단 후보</span><strong>{report.summary.candidates}</strong></div><div><span>분석 범위</span><strong>S&P 500 · {report.summary.coverage}/{report.summary.total}</strong></div></div>
  <div className="report-columns"><div className="report-main">
   <section className="report-card"><div className="report-part-title"><span>01</span><h2>오늘의 Driver</h2></div>
    <div className="driver-grid">{report.drivers.map(d=><button type="button" key={d.id} className={`driver-card layer-${d.layer} ${d.status} ${open===d.id?'is-open':''}`} aria-haspopup="dialog" onClick={()=>setOpen(d.id)}><DriverArt id={d.id} layer={d.layer}/><span className="driver-card-text"><span className="driver-card-head"><strong>{d.name}</strong><small>{layerName(d.layer)}</small><span className="sr-only">{statusName(d.status)}</span></span><span className="driver-card-fact">{statusName(d.status)} · {sourceLine(d)}</span><span className="driver-card-foot"><span>섹터 {d.sectorIds.length}</span><span>{d.candidateCount} 후보</span></span></span></button>)}</div>
    <DriverModal driver={od} fact={od&&sourceLine(od)} sectors={od?od.sectorIds.map(label):[]} candidateCount={od?.candidateCount||0} sourceCount={od?od.sources.filings+od.sources.news+od.sources.fred.length+(od.sources.proxy?1:0):0} filterActive={driver===od?.id} onFilter={()=>setDriver(driver===od.id?'':od.id)} onClose={()=>setOpen('')}>{od?.links.length>0&&<ul className="report-sources">{od.links.map(l=><li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.title}<ArrowUpRight size={13}/></a></li>)}</ul>}</DriverModal>
   </section>
   <section className="report-card"><div className="report-part-title"><span>03</span><h2>판단 후보</h2><span className="public-count">{candidates.length}</span>{driver&&<button type="button" className="public-filter" onClick={()=>setDriver('')}>{name(driver)} 필터 해제</button>}</div>
    {candidates.length?<table className="public-table"><thead><tr><th>종목</th><th>Driver · 근거</th><th>등락률</th></tr></thead><tbody>{candidates.map(c=><tr key={c.symbol}><td><strong>{c.symbol}</strong><small>{c.name} · {label(c.sector)}</small></td><td>{[...new Set(c.paths.map(p=>name(p.driverId)))].join(' · ')}<small>{[...new Set(c.paths.map(p=>p.basis))].join(' / ')}</small></td><td className={tone(c.change)}>{pct(c.change)}{Number.isFinite(c.intraday)&&<small>정규장 {pct(c.intraday)}</small>}</td></tr>)}</tbody></table>:<p className="report-empty">조건에 맞는 후보가 없습니다.</p>}
   </section>
  </div>
  <aside className="report-side"><section className="report-card"><div className="report-part-title"><span>02</span><h2>영향 경로</h2></div><div className="diverging-axis"><span className="negative">← 하락</span><span>섹터</span><span className="positive">상승 →</span></div><div className="diverging-chart">{sectors.map(s=>{const v=s.relative??s.change??0,w=`${Math.abs(v)/scale*100}%`;return <div key={s.name} className="diverging-row"><span className="diverging-half down">{v<0&&<><em className="negative">{v.toFixed(1)}</em><i style={{width:w}}/></>}</span><span className="diverging-label"><strong>{label(s.name)}</strong><small>{s.driverIds.map(name).join(' · ')}</small></span><span className="diverging-half up">{v>=0&&<><i style={{width:w}}/><em className="positive">+{v.toFixed(1)}</em></>}</span></div>})}</div>{!sectors.length&&<p className="report-empty">연결된 섹터가 없습니다.</p>}<p className="report-note">SPY 대비 %p · 확인된 Driver와 연결된 섹터만 표시합니다.</p></section></aside></div>
  <p className="fine">{report.notice}</p>
 </div>;
}
