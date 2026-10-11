// Economic release calendar from FRED (release dates for BLS, BEA, Census, Fed and others) with the
// latest published result for the main releases. FRED data here is US-government public domain.
export const releases=[
 {key:'jobs',match:/^Employment Situation$/i,title:'미국 고용보고서(비농업 고용·실업률)',time:'08:30 ET',drivers:['수요·성장','금리·할인율'],series:'PAYEMS',result:'diff',unit:'천 명',label:'비농업 고용 변화'},
 {key:'cpi',match:/^Consumer Price Index$/i,title:'소비자물가지수(CPI)',time:'08:30 ET',drivers:['물가·비용','금리·할인율'],series:'CPIAUCSL',result:'yoy',unit:'%',label:'전년 대비'},
 {key:'ppi',match:/^Producer Price Index$/i,title:'생산자물가지수(PPI)',time:'08:30 ET',drivers:['물가·비용'],series:'PPIFIS',result:'yoy',unit:'%',label:'전년 대비'},
 {key:'retail',match:/^Advance Monthly Sales for Retail and Food Services$/i,title:'소매판매',time:'08:30 ET',drivers:['수요·성장','매출·주문'],series:'RSAFS',result:'mom',unit:'%',label:'전월 대비'},
 {key:'gdp',match:/^Gross Domestic Product$/i,title:'국내총생산(GDP)',time:'08:30 ET',drivers:['수요·성장'],series:'A191RL1Q225SBEA',result:'level',unit:'%',label:'연율 성장률'},
 {key:'pce',match:/^Personal Income and Outlays$/i,title:'개인소득·지출(PCE 물가)',time:'08:30 ET',drivers:['물가·비용','수요·성장'],series:'PCEPI',result:'yoy',unit:'%',label:'PCE 물가 전년 대비'},
 {key:'claims',match:/^Unemployment Insurance Weekly Claims Report$/i,title:'신규 실업수당 청구',time:'08:30 ET',drivers:['수요·성장'],series:'ICSA',result:'level',unit:'건',label:'신규 청구'},
 {key:'jolts',match:/^Job Openings and Labor Turnover Survey$/i,title:'구인·이직 보고서(JOLTS)',time:'10:00 ET',drivers:['수요·성장'],series:'JTSJOL',result:'level',unit:'천 건',label:'구인 건수'},
 {key:'industry',match:/^G\.17 Industrial Production and Capacity Utilization$/i,title:'산업생산',time:'09:15 ET',drivers:['수요·성장','공급·경쟁 구조'],series:'INDPRO',result:'mom',unit:'%',label:'전월 대비'},
 {key:'sentiment',match:/^Surveys of Consumers$/i,title:'미시간대 소비자심리',time:'10:00 ET',drivers:['수요·성장'],series:null},
];
const round=(v,d=2)=>Math.round(v*10**d)/10**d;
// Latest result for a release from its series observations (oldest first).
export function latestResult(rel,obs){
 if(!rel.series||!obs?.length)return null;const l=obs.at(-1),p=obs.at(-2);let value=null;
 if(rel.result==='level')value=l.v;
 else if(rel.result==='diff'&&p)value=l.v-p.v;
 else if(rel.result==='mom'&&p?.v)value=(l.v/p.v-1)*100;
 else if(rel.result==='yoy'){const y=obs.find(o=>o.d===`${+l.d.slice(0,4)-1}${l.d.slice(4)}`);if(y?.v)value=(l.v/y.v-1)*100}
 if(value==null)return null;
 return {period:l.d,label:rel.label,value:rel.unit==='건'||rel.unit==='천 명'||rel.unit==='천 건'?Math.round(value):round(value),unit:rel.unit};
}
export function calendarEvents(found,results){
 return found.flatMap(({rel,dates})=>dates.map(d=>({id:`fred-${rel.key}-${d}`,date:d,type:'economic',title:rel.title,time:rel.time,source:'FRED 발표 일정',drivers:rel.drivers,key:rel.key,result:results[rel.key]&&results[rel.key].releasedOn===d?results[rel.key].value:null}))).sort((a,b)=>a.date.localeCompare(b.date));
}
// FOMC meeting dates from the Fed's calendar page ("2026 FOMC Meetings" panels). FRED's FOMC release is daily,
// so it cannot mark meetings. "*" marks meetings with a Summary of Economic Projections.
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
export function parseFomc(html,years){
 const out=[];
 for(const y of years){const i=html.indexOf(`${y} FOMC Meetings`);if(i<0)continue;const j=html.indexOf('FOMC Meetings',i+20);const seg=html.slice(i,j>0?j:i+40000);
  for(const m of seg.matchAll(/fomc-meeting__month[^>]*>\s*<strong>([^<]+)<\/strong>[\s\S]*?fomc-meeting__date[^>]*>([^<]+)</g)){
   const mon=MONTHS.findIndex(x=>m[1].trim().startsWith(x))+1;const dd=/(\d{1,2})(?:-(\d{1,2}))?/.exec(m[2]);if(!mon||!dd)continue;
   const sep=m[2].includes('*'),d1=+dd[1],d2=dd[2]?+dd[2]:d1;const iso=d=>`${y}-${String(mon).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
   if(d2!==d1)out.push({id:`fomc-${iso(d1)}`,date:iso(d1),type:'institution',title:'FOMC 회의 · 첫째 날',time:'시간 미공개',source:'Federal Reserve',drivers:['금리·할인율','유동성·자금흐름'],key:'fomc-day1'});
   out.push({id:`fomc-${iso(d2)}`,date:iso(d2),type:'institution',title:sep?'FOMC 금리 결정 · 경제전망 발표':'FOMC 금리 결정',time:'14:00 ET',source:'Federal Reserve',drivers:['금리·할인율','유동성·자금흐름'],key:'fomc'})}}
 return out;
}
