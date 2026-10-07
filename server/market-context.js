// Long-run context: where each big indicator sits versus its own history and past eras.
// publicValue=false: the series is not redistributable, so only its position (percentile) is published.
export const contextIndicators=[
 {id:'rate10',name:'10년물 국채 금리',fred:'DGS10',unit:'%',publicValue:true,drivers:['rates'],plain:'정부가 10년 동안 돈을 빌릴 때 내는 이자예요. 모든 대출·투자의 기본 가격 역할을 해요.'},
 {id:'real10',name:'실질 금리(10년)',fred:'DFII10',unit:'%',publicValue:true,drivers:['rates'],plain:'이자에서 물가 상승분을 뺀 “진짜” 이자예요. 높을수록 돈을 빌리기 부담스럽고, 예금·채권이 주식보다 매력적이에요.'},
 {id:'curve',name:'장단기 금리차(10년−2년)',fred:'T10Y2Y',unit:'%p',publicValue:true,drivers:['rates','demand'],plain:'긴 대출과 짧은 대출 이자의 차이예요. 마이너스(역전)면 경기 침체를 걱정하는 신호로 자주 읽혀요.'},
 {id:'breakeven',name:'기대 인플레이션(10년)',fred:'T10YIE',unit:'%',publicValue:true,drivers:['cost'],plain:'채권 시장이 예상하는 앞으로 10년간 평균 물가 상승률이에요. 연준 목표는 2% 안팎이에요.'},
 {id:'cpi',name:'소비자물가 상승률',fred:'CPIAUCSL',transform:'yoy',unit:'%',publicValue:true,drivers:['cost'],plain:'1년 전보다 생활 물가가 얼마나 올랐는지예요. 연준 목표는 2%예요.'},
 {id:'policy',name:'기준금리',fred:'FEDFUNDS',unit:'%',publicValue:true,drivers:['rates','liquidity'],plain:'연준이 정하는 하루짜리 돈의 가격이에요. 모든 금리의 출발점이에요.'},
 {id:'unemp',name:'실업률',fred:'UNRATE',unit:'%',publicValue:true,drivers:['demand'],plain:'일하고 싶은데 일자리가 없는 사람의 비율이에요. 낮을수록 경기가 튼튼해요.'},
 {id:'dollar',name:'달러 가치',fred:'DTWEXBGS',unit:'',publicValue:true,drivers:['fx'],plain:'주요 교역국 돈과 비교한 달러의 힘이에요. 높으면 수입품은 싸지고 미국 기업의 해외 매출은 줄어 보여요.'},
 {id:'vix',name:'공포지수(VIX)',fred:'VIXCLS',unit:'',publicValue:false,drivers:['credit','liquidity'],plain:'앞으로 한 달간 주가가 얼마나 출렁일지에 대한 시장의 예상이에요. 높을수록 불안해요.'},
 {id:'stocks',name:'실질 주가(S&P 500)',source:'shiller',unit:'',publicValue:false,drivers:['demand','liquidity'],plain:'물가 상승을 빼고 본 S&P 500 지수의 수준이에요. 150년 역사 속 위치를 봐요.'},
];
// Fixed historical eras for comparison (inclusive years).
export const eras=[
 {id:'pre2008',label:'2000~2007년',from:2000,to:2007},
 {id:'zero',label:'저금리 시대(2009~2021년)',from:2009,to:2021},
];
export function percentile(values,v){if(!values.length||!Number.isFinite(v))return null;return Math.round(values.filter(x=>x<=v).length/values.length*100)}
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
export function yoy(obs){const byMonth=new Map(obs.map(o=>[o.d.slice(0,7),o.v]));return obs.map(o=>{const y=`${+o.d.slice(0,4)-1}${o.d.slice(4,7)}`,p=byMonth.get(y);return p>0?{d:o.d,v:(o.v/p-1)*100}:null}).filter(Boolean)}
export function positionText(p){return p==null?'판단 불가':p>=90?'역사적으로 매우 높음':p>=70?'높은 편':p>30?'보통 범위':p>10?'낮은 편':'역사적으로 매우 낮음'}
// obs: [{d:'YYYY-MM-DD',v}] sorted. windowYears: range used for the percentile.
export function describe(ind,obs,{now=new Date(),windowYears=20}={}){
 const series=ind.transform==='yoy'?yoy(obs):obs;if(!series.length)return null;
 const last=series.at(-1),from=`${now.getUTCFullYear()-windowYears}`;
 const win=series.filter(o=>o.d>=from).map(o=>o.v),pct=percentile(win,last.v),avg=mean(win);
 const eraAvg=eras.map(e=>({id:e.id,label:e.label,avg:mean(series.filter(o=>+o.d.slice(0,4)>=e.from&&+o.d.slice(0,4)<=e.to).map(o=>o.v))})).filter(e=>e.avg!=null);
 const out={id:ind.id,name:ind.name,plain:ind.plain,drivers:ind.drivers,unit:ind.unit,asOf:last.d,windowFrom:series.find(o=>o.d>=from)?.d||series[0].d,percentile:pct,position:positionText(pct)};
 if(ind.publicValue){out.value=round(last.v);out.average=round(avg);out.min=round(Math.min(...win));out.max=round(Math.max(...win));out.eras=eraAvg.map(e=>({...e,avg:round(e.avg)}));out.compare=compareText(ind,last.v,avg,eraAvg)}
 else{out.eras=eraAvg.map(e=>({id:e.id,label:e.label,percentile:percentile(win,e.avg)}));out.compare=`최근 ${windowYears}년 중 ${pct>=100?'가장 높은':pct>=50?`상위 ${Math.max(1,100-pct)}%`:`하위 ${Math.max(1,pct)}%`} 수준이에요.`}
 return out;
}
const round=v=>Number.isFinite(v)?Math.round(v*100)/100:null;
function compareText(ind,v,avg,eraAvg){
 const u=ind.unit==='%'||ind.unit==='%p'?ind.unit:'',f=x=>`${round(x)}${u}`;
 const parts=[`최근 20년 평균(${f(avg)})보다 ${v>avg?'높아요':'낮아요'}`];
 const zero=eraAvg.find(e=>e.id==='zero'),pre=eraAvg.find(e=>e.id==='pre2008');
 if(zero)parts.push(`저금리 시대 평균 ${f(zero.avg)}`);if(pre)parts.push(`2000년대 초 평균 ${f(pre.avg)}`);
 return `지금 ${f(v)} · ${parts.join(' · ')}`;
}
// Overall reading in plain language, built only from computed positions.
export function overall(items){
 const by=Object.fromEntries(items.filter(Boolean).map(i=>[i.id,i])),hi=id=>by[id]?.percentile>=70,lo=id=>by[id]?.percentile<=30,lines=[];
 if(hi('rate10')&&hi('stocks'))lines.push('금리와 주가가 동시에 높은 편이에요. 보통 금리가 높으면 주가가 눌리는데, 둘 다 높은 건 흔하지 않은 조합이에요.');
 else if(hi('rate10'))lines.push('금리가 과거보다 높은 편이에요. 돈 빌리는 비용이 커서 기업과 가계에 부담이 돼요.');
 else if(hi('stocks'))lines.push('주가가 물가를 감안해도 역사적으로 높은 수준이에요.');
 if(hi('real10'))lines.push('물가를 빼고도 이자가 높아서, 위험을 감수하지 않아도 꽤 괜찮은 수익을 얻을 수 있는 환경이에요.');
 if(by.curve&&by.curve.value<0)lines.push('장단기 금리가 뒤집혀 있어요. 과거에는 경기 침체 전에 자주 나타났던 모습이에요.');
 if(by.cpi&&by.cpi.value>3)lines.push('물가가 연준 목표(2%)보다 여전히 높아요.');else if(by.cpi&&by.cpi.value<=2.5)lines.push('물가는 연준 목표(2%) 가까이 내려와 있어요.');
 if(lo('unemp'))lines.push('실업률이 낮아 일자리 시장은 튼튼한 편이에요.');
 if(hi('vix'))lines.push('공포지수가 높아 시장이 불안해하고 있어요.');else if(lo('vix'))lines.push('공포지수는 낮아 시장이 비교적 차분해요.');
 return lines.length?lines:['대부분의 지표가 과거 보통 범위 안에 있어요.'];
}

// Scenarios: how participants commonly behave in this kind of environment, ranked by how strongly
// the current positions support each one. Descriptive, not a recommendation.
const P=(by,id)=>by[id]?.percentile??null,V=(by,id)=>by[id]?.value??null;
const ev=(by,id)=>{const i=by[id];if(!i)return null;return i.value!=null?`${i.name} ${i.value}${i.unit==='%'||i.unit==='%p'?i.unit:''}(${i.position})`:`${i.name} ${i.position}`};
export const scenarioLibrary=[
 {id:'yield_hunt',title:'안전한 이자로 돈이 모이는 흐름',score:by=>avg([P(by,'real10'),P(by,'rate10')]),
  basis:['real10','rate10'],act:'위험을 크게 지지 않아도 이자가 높으니, 예금·단기 국채·채권형 상품으로 돈을 옮기는 사람이 늘어요. 배당을 보고 사던 주식은 상대적으로 덜 매력적으로 보여요.',
  watch:'국채 금리가 계속 높게 유지되는지, 채권형 상품으로 자금이 계속 들어오는지',against:'금리가 빠르게 내려가면 이 흐름은 약해져요.',drivers:['rates','liquidity']},
 {id:'stretched',title:'비싼 주가 속 “잘 버는 회사” 쏠림',score:by=>avg([P(by,'stocks'),P(by,'real10')]),
  basis:['stocks','real10'],act:'주가가 이미 높고 이자도 높아서, 사람들은 아무 주식이나 사기보다 실적이 확실한 대형 기업에 몰려요. 실적이 기대에 못 미치면 크게 팔리는 일이 잦아져요.',
  watch:'실적 발표 후 주가 반응의 크기, 대형주와 중소형주의 수익률 차이',against:'실적이 폭넓게 좋아지거나 금리가 내려가면 쏠림이 풀려요.',drivers:['revenue','margin','rates']},
 {id:'inflation_hedge',title:'물가 대비 자산 찾기',score:by=>avg([P(by,'cpi'),P(by,'breakeven')]),
  basis:['cpi','breakeven'],act:'물가가 목표보다 높게 머무르면 원자재·에너지·금처럼 물가와 함께 오르는 자산이나 가격을 올릴 수 있는 기업을 찾는 사람이 늘어요.',
  watch:'월간 물가 발표, 유가·원자재 가격',against:'물가가 2% 가까이 내려오면 약해져요.',drivers:['cost','supply']},
 {id:'strong_dollar',title:'강한 달러의 부담',score:by=>P(by,'dollar'),
  basis:['dollar'],act:'달러가 강하면 해외에서 돈을 버는 미국 기업의 실적이 줄어 보이고, 미국 밖 자산에서 돈이 빠져 미국으로 들어오는 경향이 있어요.',
  watch:'달러 지수, 해외 매출 비중이 큰 기업의 실적 전망',against:'달러가 약해지면 해외 매출 기업이 다시 주목받아요.',drivers:['fx','revenue']},
 {id:'cut_bet',title:'금리 인하를 기다리는 흐름',score:by=>{const p=P(by,'policy');if(p==null)return null;const c=V(by,'cpi');return p*(c!=null&&c<=3?1:0.7)},
  basis:['policy','cpi'],act:'기준금리가 높은 상태라 “언제 내릴까”에 관심이 쏠려요. 연준 발언과 고용·물가 발표 하나하나에 주가가 크게 반응해요.',
  watch:'연준 회의 결과와 발언, 고용·물가 발표 직후 반응',against:'물가가 다시 오르면 인하 기대가 꺾여요.',drivers:['rates','policy']},
 {id:'recession_hedge',title:'경기 둔화에 대비하는 흐름',score:by=>{const c=P(by,'curve'),u=P(by,'unemp');if(c==null)return null;return (100-c)*0.7+(u??50)*0.3},
  basis:['curve','unemp'],act:'장단기 금리차가 작거나 뒤집히면 경기 둔화를 걱정해 필수소비재·헬스케어·유틸리티처럼 경기를 덜 타는 업종으로 옮기는 사람이 늘어요.',
  watch:'장단기 금리차, 실업률·신규 실업수당 청구',against:'금리차가 넓어지고 고용이 튼튼하면 약해져요.',drivers:['demand','rates']},
 {id:'calm_rally',title:'불안이 낮을 때의 추격 매수',score:by=>{const v=P(by,'vix'),s=P(by,'stocks');if(v==null||s==null)return null;return avg([100-v,s])},
  basis:['vix','stocks'],act:'시장이 차분하고 주가가 오르는 중이면 “놓치기 싫어서” 따라 사는 사람이 늘어요. 이런 때는 작은 악재에도 급하게 되파는 일이 생겨요.',
  watch:'공포지수가 갑자기 뛰는지, 거래량이 몰리는 종목',against:'공포지수가 오르면 빠르게 식어요.',drivers:['liquidity','demand']},
];
function avg(a){const v=a.filter(Number.isFinite);return v.length===a.length?v.reduce((s,x)=>s+x,0)/v.length:null}
export function scenarios(items,n=3){
 const by=Object.fromEntries(items.filter(Boolean).map(i=>[i.id,i]));
 return scenarioLibrary.map(s=>({s,score:s.score(by)})).filter(x=>Number.isFinite(x.score)).sort((a,b)=>b.score-a.score).slice(0,n)
  .map(({s,score},i)=>({rank:i+1,id:s.id,title:s.title,strength:score>=80?'강함':score>=60?'보통':'약함',score:Math.round(score),
   basis:s.basis.map(id=>ev(by,id)).filter(Boolean),act:s.act,watch:s.watch,against:s.against,drivers:s.drivers}));
}
