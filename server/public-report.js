// Public, result-only view of a report. Excludes raw prices/volumes/charts, news headlines and AI quotes,
// FRED values (some series are not redistributable) and fitted statistics.
const r1=v=>Number.isFinite(v)?Math.round(v*10)/10:null;
const publicSource=e=>e?.kind==='filing'&&/^https:\/\/www\.sec\.gov\//.test(e.url||'')?{kind:'filing',title:e.title,url:e.url,publishedAt:e.publishedAt}:null;
export function toPublicReport(report,generatedAt){
 const t=report.thesis;if(!t)return null;
 const drivers=t.drivers.map(d=>({id:d.id,name:d.name,layer:d.layer,status:d.status,
  sources:{filings:d.evidence.filter(e=>e.kind==='filing').length,news:d.evidence.filter(e=>e.kind!=='filing').length,fred:(d.macro||[]).filter(m=>m.active).map(m=>m.label),proxy:d.proxy?.active?d.proxy.symbol:null},
  links:d.evidence.map(publicSource).filter(Boolean).slice(0,5),sectorIds:d.sectorIds,candidateCount:d.candidateSymbols.length}));
 const sectors=t.sectors.map(s=>({name:s.name,symbol:s.symbol,change:r1(s.change),relative:r1(s.relative),intraday:r1(s.intraday),driverIds:s.driverIds,company:!s.sectorDriverIds.length,explanations:(s.explanations||[]).map(e=>({driverId:e.driverId,text:e.text})),candidateCount:s.candidateSymbols.length}));
 const candidates=t.candidates.map(c=>({symbol:c.symbol,name:c.name,sector:c.sector,change:r1(c.change),intraday:r1(c.intraday),relativeToSector:r1(c.relativeToSector),reasons:c.reasons,
  paths:c.paths.map(p=>({driverId:p.driverId,scope:p.scope,basis:p.basis,links:(p.evidence||[]).map(publicSource).filter(Boolean).slice(0,3)}))}));
 return {version:1,date:report.date,session:report.session||'post',cutoff:report.cutoff||null,generatedAt,
  summary:{observed:drivers.filter(d=>d.status==='observed').length,sectors:sectors.length,candidates:candidates.length,coverage:report.coverage,total:report.total},
  drivers,sectors,candidates,
  notice:'공개본은 결과 요약입니다. 가격·거래량·차트, 뉴스 원문, 거시 지표 수치와 통계값은 데이터 이용 조건에 따라 제외했습니다. 후보는 매수·매도 권유가 아닙니다.'};
}
