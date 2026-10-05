// FRED signal → sector → stock links. Sign = effect on the sector when the series rises.
import {macroSeries} from './macro-series.js';
const IT='Information Technology',CS='Communication Services',CD='Consumer Discretionary',ST='Consumer Staples',FIN='Financials',RE='Real Estate',UT='Utilities',EN='Energy',IN='Industrials',MA='Materials',HC='Health Care';
export const macroChannels={
 DGS10:{[IT]:[-1,'장기금리 상승은 먼 미래 이익의 할인 부담을 키웁니다.'],[CS]:[-1,'장기금리 상승은 성장 현금흐름의 할인 부담으로 전달됩니다.'],[CD]:[-1,'금리 상승은 소비자 금융 비용과 할인율 부담으로 전달됩니다.'],[RE]:[-1,'금리 상승은 차환 비용과 자산 할인율 부담으로 전달됩니다.'],[UT]:[-1,'금리 상승은 배당 자산의 상대 매력과 조달 비용에 부담입니다.'],[FIN]:[1,'금리 상승은 예대마진 확대 기대로 전달될 수 있습니다.']},
 DFII10:{[IT]:[-1,'실질금리 상승은 성장주 밸류에이션 부담으로 전달됩니다.'],[CS]:[-1,'실질금리 상승은 장기 성장 자산의 할인 부담입니다.'],[RE]:[-1,'실질금리 상승은 부동산 자산 가치 부담입니다.']},
 DCOILWTICO:{[EN]:[1,'유가 상승은 에너지 생산자의 판매가격·이익 기대로 전달됩니다.'],[IN]:[-1,'유가 상승은 운송·생산 비용 부담으로 전달됩니다.'],[CD]:[-1,'유가 상승은 가계 가처분소득과 물류 비용 부담으로 전달됩니다.'],[ST]:[-1,'유가 상승은 물류·포장 비용 부담으로 전달됩니다.']},
 T5YIE:{[EN]:[1,'기대인플레이션 상승은 실물자산·원자재 가격 기대와 함께 움직입니다.'],[MA]:[1,'기대인플레이션 상승은 원자재 가격 기대로 전달됩니다.'],[IT]:[-1,'기대인플레이션 상승은 금리 경로를 통해 성장주 부담으로 전달됩니다.']},
 BAMLH0A0HYM2:{[FIN]:[-1,'하이일드 스프레드 확대는 신용 위험과 대손 우려로 전달됩니다.'],[RE]:[-1,'스프레드 확대는 차환·조달 여건 악화로 전달됩니다.'],[CD]:[-1,'스프레드 확대는 경기 민감 소비 기업의 조달 부담입니다.'],[IN]:[-1,'스프레드 확대는 경기 민감 설비 기업의 조달 부담입니다.'],[ST]:[1,'스프레드 확대 국면에서 방어 업종으로 수요가 이동할 수 있습니다.'],[UT]:[1,'스프레드 확대 국면에서 방어 업종으로 수요가 이동할 수 있습니다.']},
 BAA10Y:{[FIN]:[-1,'회사채 스프레드 확대는 신용 위험 확대로 전달됩니다.'],[RE]:[-1,'회사채 스프레드 확대는 조달 비용 부담입니다.']},
 DTWEXBGS:{[IT]:[-1,'달러 강세는 해외 매출의 원화·달러 환산 감소로 전달됩니다.'],[MA]:[-1,'달러 강세는 달러 표시 원자재 가격 부담으로 전달됩니다.'],[EN]:[-1,'달러 강세는 원유 등 달러 표시 상품 가격 부담입니다.'],[IN]:[-1,'달러 강세는 수출 기업 가격 경쟁력 부담입니다.'],[UT]:[1,'내수 중심 업종은 달러 강세의 환산 부담이 적습니다.']},
 PAYEMS:{[CD]:[1,'고용 증가는 가계 소득과 재량 소비로 전달됩니다.'],[IN]:[1,'고용 증가는 경기 확장 기대로 전달됩니다.'],[FIN]:[1,'고용 증가는 대출 수요와 신용 건전성 기대로 전달됩니다.']},
 RSAFS:{[CD]:[1,'소매판매 증가는 재량 소비 기업 매출 기대로 전달됩니다.'],[ST]:[1,'소매판매 증가는 필수소비재 판매 기대로 전달됩니다.']},
 INDPRO:{[IN]:[1,'산업생산 증가는 설비·운송 수요로 전달됩니다.'],[MA]:[1,'산업생산 증가는 원자재 수요로 전달됩니다.'],[EN]:[1,'산업생산 증가는 에너지 수요로 전달됩니다.']},
 ICSA:{[CD]:[-1,'실업수당 청구 증가는 고용 둔화와 소비 위축 우려로 전달됩니다.'],[FIN]:[-1,'실업수당 청구 증가는 신용 건전성 우려로 전달됩니다.']},
 CPIAUCSL:{[RE]:[-1,'물가 상승은 금리 경로를 통해 부동산 할인율 부담으로 전달됩니다.'],[CD]:[-1,'물가 상승은 실질 구매력 부담으로 전달됩니다.'],[EN]:[1,'물가 상승 국면에서 실물·에너지 자산 선호가 나타날 수 있습니다.']},
 PPIFIS:{[ST]:[-1,'생산자물가 상승은 원가 부담으로 전달됩니다.'],[IN]:[-1,'생산자물가 상승은 투입 비용 부담으로 전달됩니다.']},
 NFCI:{[FIN]:[-1,'금융여건 긴축은 자금 조달·거래 여건 악화로 전달됩니다.'],[IT]:[-1,'금융여건 긴축은 위험자산 선호 약화로 전달됩니다.'],[CD]:[-1,'금융여건 긴축은 소비 신용 여건 악화로 전달됩니다.']},
 WALCL:{[FIN]:[1,'연준 자산 확대는 시장 유동성 확대로 전달됩니다.'],[IT]:[1,'유동성 확대는 위험자산 선호로 전달될 수 있습니다.']},
};
const fmtDay=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}),cache=new Map();
const etDay=t=>{let d=cache.get(t);if(d===undefined){d=fmtDay.format(new Date(t));cache.set(t,d)}return d};
const seriesById=Object.fromEntries(macroSeries.map(s=>[s.id,s]));
export function factorChanges(series,observations=[]){
 const out=new Map();for(let i=1;i<observations.length;i++){const a=observations[i-1].v,b=observations[i].v;const c=series.kind==='pct'?(a?(b/a-1)*100:NaN):b-a;if(Number.isFinite(c))out.set(observations[i].d,c)}return out;
}
// Correlation of daily asset returns (%) with factor changes on matching ET dates, excluding asOf.
export function dateAssociation(rows=[],changes,asOf){
 const pairs=[];for(let i=1;i<rows.length;i++){const d=etDay(rows[i].t);if(d>=asOf)continue;const f=changes.get(d),r=rows[i-1].c>0?(rows[i].c/rows[i-1].c-1)*100:NaN;if(Number.isFinite(f)&&Number.isFinite(r))pairs.push([r,f])}
 const p=pairs.slice(-60);if(p.length<30)return null;
 const n=p.length,mx=p.reduce((s,v)=>s+v[1],0)/n,my=p.reduce((s,v)=>s+v[0],0)/n;
 const vx=p.reduce((s,v)=>s+(v[1]-mx)**2,0),vy=p.reduce((s,v)=>s+(v[0]-my)**2,0),cov=p.reduce((s,v)=>s+(v[1]-mx)*(v[0]-my),0);
 return vx>0&&vy>0?{beta:cov/vx,correlation:cov/Math.sqrt(vx*vy),samples:n}:null;
}
export function buildMacroLinks({report,rows,macro,asOf}){
 const active=(report.macro||[]).filter(m=>m.active&&macroChannels[m.id]&&Number.isFinite(m.change)&&m.change!==0);
 const sectorLinks=[],stockPaths={};
 for(const m of active){
  const series=seriesById[m.id],daily=series.freq==='daily',changes=daily?factorChanges(series,macro?.series?.[m.id]?.observations):null;
  for(const sector of report.sectors){
   const ch=macroChannels[m.id][sector.name];if(!ch||!Number.isFinite(sector.relative))continue;
   const expected=Math.sign(ch[0]*m.change);
   let exposure=null;
   if(daily){exposure=dateAssociation(rows[sector.symbol],changes,asOf);if(!exposure||Math.abs(exposure.correlation)<0.3||Math.sign(exposure.beta)!==ch[0])continue}
   if(Math.sign(sector.relative)!==expected||Math.abs(sector.relative)<(daily?0.3:0.5))continue;
   sectorLinks.push({sector:sector.name,driverId:m.driver,seriesId:m.id,seriesLabel:m.label,text:ch[1],correlation:exposure?.correlation??null,samples:exposure?.samples??null,kind:daily?'daily':'release'});
   for(const stock of report.stocks.filter(s=>s.sector===sector.name&&Math.sign(s.change)===expected)){
    let se=null;
    if(daily){se=dateAssociation(rows[stock.symbol],changes,asOf);if(!se||Math.abs(se.correlation)<0.35||Math.sign(se.beta)!==ch[0])continue}
    (stockPaths[stock.symbol]??=[]).push({driverId:m.driver,scope:'sector',basis:daily?'FRED 지표·섹터·종목 통계적 동반 반응':'지표 발표일 섹터·종목 동반 반응',
     reason:`${m.label}(${m.id}) ${m.change>0?'상승':'하락'}과 ${sector.symbol} SPY 대비 ${sector.relative>0?'+':''}${sector.relative.toFixed(2)}%p, ${stock.symbol} ${stock.change>0?'+':''}${stock.change.toFixed(2)}%의 방향이 경로 가설${daily?'과 과거 노출 관계':''}에 맞습니다.`,
     transmission:`${ch[1]} 반대 방향에서는 역경로를 가정합니다.`,
     exposure:se,sectorExposure:exposure?{correlation:exposure.correlation,samples:exposure.samples}:null,evidence:[{title:`${m.label} ${m.id} · ${m.date}`,url:m.url,source:'FRED',publishedAt:m.lastUpdated}],
     caution:daily?'상관은 과거 60거래일 기준이며 인과를 입증하지 않습니다. 같은 날 다른 사건이 같은 방향으로 작용했을 수 있습니다.':'발표치의 시장 예상 대비 여부는 판단하지 않았습니다. 발표 방향과 섹터 반응이 일치한다는 사실만 나타냅니다.'});
   }
  }
 }
 return {sectorLinks,stockPaths};
}
