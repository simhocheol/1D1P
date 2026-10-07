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
 // World around the US market (group: global). FX from the Fed H.10 release; long rates from OECD via FRED.
 {id:'krw',group:'global',name:'원·달러 환율',fred:'DEXKOUS',unit:'원',publicValue:true,drivers:['fx'],plain:'1달러를 사는 데 드는 원화예요. 미국 주식 수익은 원화로 돌아오니, 환율이 오르면 수익이 늘고 내리면 줄어요.'},
 {id:'jpy',group:'global',name:'엔·달러 환율',fred:'DEXJPUS',unit:'엔',publicValue:true,drivers:['fx','liquidity'],plain:'1달러에 몇 엔인지예요. 높을수록 엔화가 약해요. 싼 엔화를 빌려 해외에 투자하는 흐름(엔캐리)과 관련돼요.'},
 {id:'eur',group:'global',name:'유로 가치(달러 기준)',fred:'DEXUSEU',unit:'달러',publicValue:true,drivers:['fx'],plain:'1유로가 몇 달러인지예요. 높을수록 유로가 강하고 달러가 약해요.'},
 {id:'cny',group:'global',name:'위안·달러 환율',fred:'DEXCHUS',unit:'위안',publicValue:true,drivers:['fx','demand'],plain:'1달러에 몇 위안인지예요. 위안이 약하면 중국 경기 걱정이나 중국의 수출 경쟁력 강화로 읽혀요.'},
 {id:'jp10',group:'global',name:'일본 10년물 금리',fred:'IRLTLT01JPM156N',unit:'%',publicValue:true,drivers:['rates'],plain:'일본 정부가 10년간 돈을 빌리는 이자예요. 오르면 일본으로 돈이 돌아가며 해외 자산을 파는 일이 생길 수 있어요.'},
 {id:'de10',group:'global',name:'독일 10년물 금리',fred:'IRLTLT01DEM156N',unit:'%',publicValue:true,drivers:['rates'],plain:'유럽의 기준 역할을 하는 독일 국채 이자예요. 유럽 경기와 유럽중앙은행 정책을 반영해요.'},
 {id:'usjp',group:'global',name:'미국−일본 금리차(10년)',derived:['DGS10','IRLTLT01JPM156N'],unit:'%p',publicValue:true,drivers:['rates','liquidity'],plain:'미국과 일본 10년물 이자 차이예요. 클수록 엔화를 빌려 미국에 투자할 유인이 커요. 이 차이가 갑자기 줄면 그 돈이 빠르게 되돌아가며 미국 증시가 흔들릴 수 있어요.'},
];
// Economic direction: is activity improving or worsening? Compares the recent average with the one before it.
// better: +1 when a rise is good news, -1 when a rise is bad news. mode 'momentum' compares average monthly gains.
export const directionIndicators=[
 {id:'claims',source:'미국 노동부 · 매주 목요일 발표',name:'신규 실업수당 청구',fred:'ICSA',k:4,better:-1,threshold:3,publicValue:true,unit:'건',plain:'이번 주에 처음 실업수당을 신청한 사람 수예요. 매주 나와서 고용이 나빠지는 걸 가장 빨리 보여줘요.',drivers:['demand']},
 {id:'payrolls',source:'미국 노동통계국(BLS) 고용보고서 · 매월 첫 금요일',name:'일자리 증가 속도',fred:'PAYEMS',k:3,better:1,mode:'momentum',threshold:15,publicValue:true,unit:'천 명/월',plain:'한 달에 새로 생기는 일자리 수예요. 증가 속도가 줄면 경기가 식는 신호예요.',drivers:['demand']},
 {id:'retail',source:'미국 인구조사국 · 매월 중순',name:'소매판매',fred:'RSAFS',k:3,better:1,threshold:0.5,publicValue:true,unit:'',plain:'가게·온라인에서 팔린 물건의 총액이에요. 미국 경제의 약 70%가 소비라 중요해요.',drivers:['demand','revenue']},
 {id:'industry',source:'연방준비제도 · 매월 중순',name:'산업생산',fred:'INDPRO',k:3,better:1,threshold:0.3,publicValue:true,unit:'',plain:'공장·광산·전력에서 만든 양이에요. 제조업 경기를 보여줘요.',drivers:['demand','supply']},
 {id:'permits',source:'미국 인구조사국 · 매월 중순',name:'주택 건축 허가',fred:'PERMIT',k:3,better:1,threshold:3,publicValue:true,unit:'',plain:'새 집을 짓겠다고 받은 허가 수예요. 실제 공사보다 먼저 나와서 경기를 미리 보여줘요.',drivers:['demand','rates']},
 {id:'sentiment',source:'미시간대 소비자 조사 · 매월 2회',name:'소비자 심리',fred:'UMCSENT',k:3,better:1,threshold:3,publicValue:false,unit:'',plain:'가계가 앞으로 경제와 살림살이를 어떻게 느끼는지 묻는 조사예요. 소비보다 먼저 움직여요.',drivers:['demand']},
];
const dirText={up:'좋아지는 중',down:'나빠지는 중',flat:'큰 변화 없음'};
export function direction(ind,obs){
 if(obs.length<ind.k*2+1)return null;
 const vals=ind.mode==='momentum'?obs.slice(1).map((o,i)=>({d:o.d,v:o.v-obs[i].v})):obs;
 const recent=mean(vals.slice(-ind.k).map(o=>o.v)),prior=mean(vals.slice(-ind.k*2,-ind.k).map(o=>o.v));
 const change=ind.mode==='momentum'?recent-prior:(recent/prior-1)*100;
 const moved=Math.abs(change)>=ind.threshold,good=Math.sign(change)*ind.better>0;
 const trend=!moved?'flat':good?'up':'down';
 const span=ind.k===4?'최근 4주':'최근 3개월',before=ind.k===4?'그 전 4주':'그 전 3개월';
 const out={id:ind.id,name:ind.name,plain:ind.plain,drivers:ind.drivers,asOf:obs.at(-1).d,trend,trendText:dirText[trend],source:`${ind.source} · FRED ${ind.fred}`,method:`${span} 평균을 ${before} 평균과 비교 · ${ind.mode==='momentum'?`월 증가폭 차이 ${ind.threshold}천 명`:`${ind.threshold}%`} 이상 움직이면 방향 판정${ind.better<0?' · 늘면 나쁜 신호':''}`};
 if(ind.publicValue){
  out.detail=ind.mode==='momentum'?`${span} 평균 월 ${Math.round(recent)}${ind.unit==='천 명/월'?'천 명':''} 증가 · ${before} 평균 ${Math.round(prior)}천 명`:`${span} 평균이 ${before}보다 ${Math.abs(round(change))}% ${change>=0?'늘었어요':'줄었어요'}`;
  out.latest=ind.mode==='momentum'?Math.round(vals.at(-1).v):round(obs.at(-1).v);
 }else out.detail=`${span} 평균이 ${before}보다 ${change>=0?'높아졌어요':'낮아졌어요'}`;
 return out;
}
export function directionSummary(list){
 const l=list.filter(Boolean),up=l.filter(x=>x.trend==='up').length,down=l.filter(x=>x.trend==='down').length;
 if(!l.length)return '경기 방향을 판단할 자료가 부족해요.';
 if(up>=down+2)return `경기 지표 ${l.length}개 중 ${up}개가 좋아지는 중이에요. 경기는 대체로 힘을 내고 있어요.`;
 if(down>=up+2)return `경기 지표 ${l.length}개 중 ${down}개가 나빠지는 중이에요. 경기가 식어가는 신호가 늘고 있어요.`;
 return `좋아지는 지표 ${up}개, 나빠지는 지표 ${down}개로 엇갈려요. 경기가 뚜렷한 방향을 정하지 못한 상태예요.`;
}
export function globalSummary(items){
 const by=Object.fromEntries(items.filter(Boolean).map(i=>[i.id,i])),lines=[];
 const krw=by.krw;if(krw?.percentile>=70)lines.push(`원·달러 환율이 ${krw.value}원으로 높은 편이에요. 지금 달러로 바꾸면 비싸게 사는 셈이고, 나중에 환율이 내려가면 원화 수익이 줄 수 있어요.`);else if(krw?.percentile<=30)lines.push(`원·달러 환율이 ${krw.value}원으로 낮은 편이에요. 달러를 싸게 살 수 있는 환경이에요.`);else if(krw)lines.push(`원·달러 환율 ${krw.value}원은 보통 범위예요.`);
 if(by.usjp?.percentile>=70&&by.jpy?.percentile>=70)lines.push('미국과 일본의 금리 차이가 크고 엔화가 약해요. 엔화를 빌려 미국에 투자하는 흐름이 커진 상태라, 갑자기 되돌려지면(2024년 8월처럼) 미국 증시도 흔들릴 수 있어요.');
 else if(by.jpy?.percentile>=90&&by.usjp?.percentile<=30)lines.push('엔화는 매우 약한데 미국−일본 금리차는 과거보다 좁은 편이에요. 엔화를 빌려 투자할 이득이 줄어 그 돈이 되돌아갈 수 있는 조합이라 지켜볼 필요가 있어요.');
 if(by.jp10?.percentile>=90)lines.push('일본 금리가 수십 년 만에 높은 수준이에요. 일본 투자자들이 해외 자산을 팔고 자국으로 돌아갈 유인이 커져요.');
 if(by.cny?.percentile>=80)lines.push('위안화가 약한 편이에요. 중국 경기 걱정과 관련이 있을 수 있어요.');
 return lines.length?lines:['주요국 환율과 금리는 대체로 보통 범위예요.'];
}
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
 const out={id:ind.id,group:ind.group||"level",name:ind.name,plain:ind.plain,drivers:ind.drivers,unit:ind.unit,asOf:last.d,windowFrom:series.find(o=>o.d>=from)?.d||series[0].d,percentile:pct,position:positionText(pct)};
 if(ind.publicValue){out.value=round(last.v);out.average=round(avg);out.min=round(Math.min(...win));out.max=round(Math.max(...win));out.eras=eraAvg.map(e=>({...e,avg:round(e.avg)}));out.compare=compareText(ind,last.v,avg,eraAvg)}
 else{out.eras=eraAvg.map(e=>({id:e.id,label:e.label,percentile:percentile(win,e.avg)}));out.compare=`최근 ${windowYears}년 중 ${pct>=100?'가장 높은':pct>=50?`상위 ${Math.max(1,100-pct)}%`:`하위 ${Math.max(1,pct)}%`} 수준이에요.`}
 return out;
}
const round=v=>Number.isFinite(v)?Math.round(v*100)/100:null;
function compareText(ind,v,avg,eraAvg){
 const u=['%','%p','원','엔','위안'].includes(ind.unit)?ind.unit:'',f=x=>`${round(x)}${u}`;
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
 {id:'yield_hunt',etfs:{in:[['SGOV','0~3개월 미국 국채'],['SHY','1~3년 미국 국채'],['AGG','미국 종합 채권']],out:[['SCHD','배당주'],['VNQ','리츠(부동산)']]},none:'금리가 높지 않아서, 이자만 보고 예금·채권으로 몰리는 움직임은 약해요.',title:'안전한 이자로 돈이 모이는 흐름',score:by=>avg([P(by,'real10'),P(by,'rate10')]),
  basis:['real10','rate10'],act:'위험을 크게 지지 않아도 이자가 높으니, 예금·단기 국채·채권형 상품으로 돈을 옮기는 사람이 늘어요. 배당을 보고 사던 주식은 상대적으로 덜 매력적으로 보여요.',
  watch:'국채 금리가 계속 높게 유지되는지, 채권형 상품으로 자금이 계속 들어오는지',against:'금리가 빠르게 내려가면 이 흐름은 약해져요.',drivers:['rates','liquidity']},
 {id:'stretched',etfs:{in:[['MGK','초대형 성장주'],['QQQ','나스닥 100'],['XLK','기술 섹터']],out:[['IWM','소형주'],['RSP','S&P 500 동일가중']]},none:'주가가 비싸지 않거나 금리가 낮아서, 소수 대형주로 쏠릴 이유가 적어요.',title:'비싼 주가 속 “잘 버는 회사” 쏠림',score:by=>avg([P(by,'stocks'),P(by,'real10')]),
  basis:['stocks','real10'],act:'주가가 이미 높고 이자도 높아서, 사람들은 아무 주식이나 사기보다 실적이 확실한 대형 기업에 몰려요. 실적이 기대에 못 미치면 크게 팔리는 일이 잦아져요.',
  watch:'실적 발표 후 주가 반응의 크기, 대형주와 중소형주의 수익률 차이',against:'실적이 폭넓게 좋아지거나 금리가 내려가면 쏠림이 풀려요.',drivers:['revenue','margin','rates']},
 {id:'inflation_hedge',etfs:{in:[['GLD','금'],['DBC','원자재 종합'],['XLE','에너지 섹터'],['TIP','물가연동 국채']],out:[['TLT','20년 이상 장기 국채']]},none:'물가가 안정돼 있어서, 원자재·금으로 물가를 대비하려는 움직임은 보기 어려워요.',title:'물가 대비 자산 찾기',score:by=>avg([P(by,'cpi'),P(by,'breakeven')]),
  basis:['cpi','breakeven'],act:'물가가 목표보다 높게 머무르면 원자재·에너지·금처럼 물가와 함께 오르는 자산이나 가격을 올릴 수 있는 기업을 찾는 사람이 늘어요.',
  watch:'월간 물가 발표, 유가·원자재 가격',against:'물가가 2% 가까이 내려오면 약해져요.',drivers:['cost','supply']},
 {id:'strong_dollar',etfs:{in:[['UUP','달러 강세'],['IWM','내수 중심 소형주']],out:[['EEM','신흥국 주식'],['EFA','선진국(미국 외) 주식']]},none:'달러가 강하지 않아서, 환율 때문에 해외 매출 기업이 손해 보는 상황은 아니에요.',title:'강한 달러의 부담',score:by=>P(by,'dollar'),
  basis:['dollar'],act:'달러가 강하면 해외에서 돈을 버는 미국 기업의 실적이 줄어 보이고, 미국 밖 자산에서 돈이 빠져 미국으로 들어오는 경향이 있어요.',
  watch:'달러 지수, 해외 매출 비중이 큰 기업의 실적 전망',against:'달러가 약해지면 해외 매출 기업이 다시 주목받아요.',drivers:['fx','revenue']},
 {id:'cut_bet',etfs:{in:[['TLT','20년 이상 장기 국채'],['IWM','소형주'],['XLRE','부동산 섹터']],out:[['SGOV','0~3개월 미국 국채']]},none:'기준금리가 높지 않아서, 금리 인하를 기다리며 움직이는 흐름은 약해요.',title:'금리 인하를 기다리는 흐름',score:by=>{const p=P(by,'policy');if(p==null)return null;const c=V(by,'cpi');return p*(c!=null&&c<=3?1:0.7)},
  basis:['policy','cpi'],act:'기준금리가 높은 상태라 “언제 내릴까”에 관심이 쏠려요. 연준 발언과 고용·물가 발표 하나하나에 주가가 크게 반응해요.',
  watch:'연준 회의 결과와 발언, 고용·물가 발표 직후 반응',against:'물가가 다시 오르면 인하 기대가 꺾여요.',drivers:['rates','policy']},
 {id:'recession_hedge',etfs:{in:[['XLP','필수소비재'],['XLV','헬스케어'],['XLU','유틸리티'],['TLT','장기 국채']],out:[['XLY','경기소비재'],['XLI','산업재'],['IWM','소형주']]},none:'장단기 금리차가 정상이고 고용도 괜찮아서, 경기 둔화에 대비해 방어 업종으로 옮기는 흐름은 약해요.',title:'경기 둔화에 대비하는 흐름',score:by=>{const c=P(by,'curve'),u=P(by,'unemp');if(c==null)return null;return (100-c)*0.7+(u??50)*0.3},
  basis:['curve','unemp'],act:'장단기 금리차가 작거나 뒤집히면 경기 둔화를 걱정해 필수소비재·헬스케어·유틸리티처럼 경기를 덜 타는 업종으로 옮기는 사람이 늘어요.',
  watch:'장단기 금리차, 실업률·신규 실업수당 청구',against:'금리차가 넓어지고 고용이 튼튼하면 약해져요.',drivers:['demand','rates']},
 {id:'calm_rally',etfs:{in:[['QQQ','나스닥 100'],['SMH','반도체'],['ARKK','혁신 성장주']],out:[['VIXY','변동성(공포지수)'],['GLD','금']]},none:'시장 불안이 낮지 않거나 주가가 높지 않아서, 들떠서 따라 사는 분위기는 아니에요.',title:'불안이 낮을 때의 추격 매수',score:by=>{const v=P(by,'vix'),s=P(by,'stocks');if(v==null||s==null)return null;return avg([100-v,s])},
  basis:['vix','stocks'],act:'시장이 차분하고 주가가 오르는 중이면 “놓치기 싫어서” 따라 사는 사람이 늘어요. 이런 때는 작은 악재에도 급하게 되파는 일이 생겨요.',
  watch:'공포지수가 갑자기 뛰는지, 거래량이 몰리는 종목',against:'공포지수가 오르면 빠르게 식어요.',drivers:['liquidity','demand']},
];
function avg(a){const v=a.filter(Number.isFinite);return v.length===a.length?v.reduce((s,x)=>s+x,0)/v.length:null}
// Five scenarios: the two best supported (strong), one in the middle, and the two least supported (weak).
// etfs are typical ETF examples where money tends to flow in or out under the scenario; descriptive, not picks.
export function scenarios(items){
 const by=Object.fromEntries(items.filter(Boolean).map(i=>[i.id,i]));
 const ranked=scenarioLibrary.map(s=>({s,score:s.score(by)})).filter(x=>Number.isFinite(x.score)).sort((a,b)=>b.score-a.score);
 const pickIdx=ranked.length>=5?[0,1,Math.floor((ranked.length-1)/2),ranked.length-2,ranked.length-1]:ranked.map((_,i)=>i);
 return pickIdx.map((idx,i)=>{const {s,score}=ranked[idx];const kind=i<2?'likely':i>=pickIdx.length-2&&pickIdx.length>=5?'unlikely':'maybe';
  return {rank:i+1,id:s.id,title:s.title,kind,label:kind==='likely'?'강한 시나리오':kind==='unlikely'||score<60?'약한 시나리오':'보통 시나리오',
   basis:s.basis.map(id=>ev(by,id)).filter(Boolean),act:s.act,none:s.none,etfs:s.etfs,watch:s.watch,against:s.against,drivers:s.drivers}});
}
