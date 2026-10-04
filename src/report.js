export const sources = [
 {id:'bls',name:'BLS · 9월 고용 공식 발표',url:'https://www.bls.gov/news.release/archives/empsit_10022026.htm',type:'공식 발표',scope:'고용·실업률·수정치'},
 {id:'reuters',name:'Reuters · 10월 2일 시장 마감',url:'https://za.investing.com/news/economy-news/wall-st-futures-gain-as-yields-oil-prices-ease-ahead-of-jobs-report-4487871',type:'마감 보도',scope:'지수·섹터·종목 등락·인상 확률'},
 {id:'kip',name:'Kiplinger · 금리와 기업 이벤트',url:'https://www.kiplinger.com/investing/stocks/nasdaq-adds-319-points-as-rate-hike-odds-ebb-stock-market-today',type:'마감 보도',scope:'국채금리의 장중 반전·기업 소식'},
];
export const report={session:'2026-10-02',reviewed:'2026-10-04',benchmark:.73,metrics:[
 {label:'S&P 500',value:'7,722.72',change:.73,source:'reuters'},
 {label:'Nasdaq Composite',value:'27,190.86',change:1.19,source:'reuters'},
 {label:'Dow Jones',value:'51,176.96',change:.49,source:'reuters'},
 {label:'미국 10년물',value:'5.279%',detail:'+4.5 bp · 종가',source:'kip'},
],groups:[
 {name:'경기소비재',kind:'섹터',change:1.4,note:'Tesla 강세가 지수 상승에 기여. Nike는 반대 방향.',source:'reuters'},
 {name:'Russell 2000',kind:'스타일 지수',change:.9,note:'소형주 반등. 섹터 수익률과 구분.',source:'reuters'},
 {name:'부동산',kind:'섹터',change:.4,note:'상승했지만 시장 대비로는 부진.',source:'reuters'},
],stocks:[
 {symbol:'NVDA',name:'NVIDIA',exchange:'NASDAQ',change:1.3,group:'AI · 반도체',tone:'support',stance:'우호·진입 유보',driver:'금리 기대 / AI',reason:'시장 강세와 함께 상승. 이 움직임을 금리 기대 하나의 효과로 확정하지 않습니다.',catalyst:'주간 자사주 매입 확대 소식도 관찰 배경입니다. 당일 상승의 단독 원인으로 판단하지 않습니다.',technical:'신고가 보도',technicalSource:'kip',question:'신고가 부근에서 가격 이격과 거래량 참여가 함께 확인되는가?',invalidate:'지지 이탈 또는 AI 수요·수익화 논리 악화가 확인되면 가설 재평가.',source:'reuters'},
 {symbol:'TSLA',name:'Tesla',exchange:'NASDAQ',change:4.7,group:'경기소비재 · 전기차',tone:'support',stance:'복합 호재 관찰',driver:'정책 기대 / 인도량',reason:'거시 반등과 기업별 소식을 함께 검토할 종목입니다. 섹터 강세에 기여했습니다.',catalyst:'분기 인도량이 예상치를 상회했다는 별도 보도. 거시 요인과 기업 요인이 겹칩니다.',technical:'지표 미검증',question:'상승 이후 일봉 지지와 거래량이 유지되는가? 확정 일봉 자료로 확인 필요.',invalidate:'기업 전망 변화 또는 상승 구간 유지 실패를 확인하면 가설 재평가.',source:'reuters'},
 {symbol:'NKE',name:'Nike',exchange:'NYSE',change:-3.6,group:'경기소비재 · 의류',tone:'risk',stance:'기업 논리 부담',driver:'매출 전망 / 중국 수요',reason:'같은 경기소비재 섹터가 올라도 개별 종목은 하락했습니다. 거시에서 종목으로 일괄 적용할 수 없는 사례입니다.',catalyst:'연간 매출 전망 악화와 중국 사업 약세가 보도됐습니다.',technical:'지표 미검증',question:'낙폭 이후 지지가 형성되는가? 낮은 RSI 또는 저평가 상태는 현재 확인하지 못했습니다.',invalidate:'전망 개선 근거가 확인되면 부정적 가설 재검토. 가격 하락만으로 매수대 판정하지 않음.',source:'reuters'},
 {symbol:'WDC',name:'Western Digital',exchange:'NASDAQ',change:-10,approximate:true,group:'AI 데이터센터 · 스토리지',tone:'risk',stance:'공급 경쟁 우려',driver:'경쟁사 공급 / 가격',reason:'AI 관련 종목이라고 일괄 수혜로 분류할 수 없습니다. 공급 측 변화는 다른 방향으로 작용할 수 있습니다.',catalyst:'Toshiba의 AI 데이터센터용 HDD 생산능력 확대 계획 보도가 관련 배경으로 제시됐습니다.',technical:'지표 미검증',question:'거래량을 동반한 지지 이탈인지, 단기 충격인지 과거 봉으로 확인 필요.',invalidate:'공급 확대 일정·실행 여부 또는 수요 상쇄 근거가 바뀌면 재평가.',source:'reuters'},
 {symbol:'STX',name:'Seagate Technology',exchange:'NASDAQ',change:-10,approximate:true,group:'AI 데이터센터 · 스토리지',tone:'risk',stance:'공급 경쟁 우려',driver:'경쟁사 공급 / 가격',reason:'스토리지 그룹의 약세 사례입니다. 반도체·서버·스토리지를 동일한 테마 방향으로 보지 않습니다.',catalyst:'WDC와 함께 약 10% 하락으로 보도됐습니다. 정확한 종가·수익률 원자료는 미확보입니다.',technical:'지표 미검증',question:'후속 거래일의 가격 안정과 거래량 감소가 관측되는가?',invalidate:'새 수요·수익성 근거 또는 공급 경쟁 상황 변화가 확인되면 재평가.',source:'reuters'},
]};
export function relative(change){return Number((change-report.benchmark).toFixed(2));}
const stockPaths={NVDA:'자본·기업 사건 / 금리·할인율',TSLA:'매출·주문 / 금리·할인율',NKE:'매출·주문',WDC:'공급·경쟁 구조',STX:'공급·경쟁 구조'};
report.stocks=report.stocks.map(s=>({...s,driver:stockPaths[s.symbol],stance:'설명 근거 추적'}));
export function activityScore(value,step){return value==null?null:Math.min(5,Math.ceil(Math.abs(value)/step));}
export const driverLayers=[{id:'macro',name:'거시',count:6},{id:'industry',name:'산업·정책',count:3},{id:'company',name:'기업',count:3}];
export const drivers=[
 {id:'demand',layer:'macro',name:'수요·성장',definition:'가계·기업·정부·해외 수요가 매출과 성장 전망에 전달되는 경로.',indicators:'소비·생산·투자·고용',value:61/90*100,step:20,observation:'고용 예상 대비 −61,000명',direction:'고용 예상 하회',path:'고용 둔화 → 성장 전망 / 정책 기대 → 기업 수요·가치평가',detail:'고용은 수요·성장의 간접 관측 항목입니다. 실제 +29,000명, Reuters 예상 +90,000명. 소비 감소를 직접 확인한 것은 아닙니다.',source:'bls',rule:'고용 예상 대비 편차 절댓값 20%당 1단계 · Reuters 예상 기준'},
 {id:'cost',layer:'macro',name:'물가·비용',definition:'판매가격·임금·원자재·운송비가 기업 원가와 가격 결정력에 전달되는 경로.',indicators:'CPI·PPI·임금·유가·금속'},
 {id:'rates',layer:'macro',name:'금리·할인율',definition:'정책금리 기대·실질금리·장기금리가 미래 현금흐름 가치와 금융비용에 전달되는 경로.',indicators:'정책금리 기대·국채·실질금리',value:4.5,step:2,observation:'10년물 종가 +4.5bp',direction:'장중 하락 → 종가 상승',path:'고용 발표 → 정책 기대 → 금리 재평가 → 할인율·조달비용',detail:'국채금리는 전달 요인의 관측 값입니다. 정책금리 결정과 같지 않습니다. 장중 하락이 마감에는 반전됐습니다.',source:'kip',rule:'10년물 절대 종가 변화 2bp당 1단계'},
 {id:'credit',layer:'macro',name:'신용·자금조달',definition:'대출·차환 접근성과 신용 위험이 기업 운영·투자에 전달되는 경로.',indicators:'신용스프레드·대출 기준·차환 일정'},
 {id:'liquidity',layer:'macro',name:'유동성·자금흐름',definition:'시장 자금 공급과 자금 이동이 포지션·거래 여건에 전달되는 경로.',indicators:'자금시장·중앙은행 자산·펀드 흐름'},
 {id:'fx',layer:'macro',name:'환율',definition:'사업지역 환율이 매출 환산·수입 비용·외화 부채에 전달되는 경로.',indicators:'달러·사업지역 환율·환헤지'},
 {id:'policy',layer:'industry',name:'정책·규제·시장 접근',definition:'관세·제재·규제·보조금이 사업 허용 범위와 경제성을 바꾸는 경로.',indicators:'법령·행정 조치·제재·기관 원문'},
 {id:'supply',layer:'industry',name:'공급·경쟁 구조',definition:'증설·감산·신규 경쟁·공급 차질이 가격과 시장점유율에 전달되는 경로.',indicators:'생산능력·재고·경쟁사 계획',observation:'Toshiba HDD 생산 확대 보도',direction:'공급 경쟁 가능성',path:'경쟁사 증설 계획 → 가격·마진 우려 → WDC·STX',detail:'계획 실행과 가격 영향은 미검증입니다. AI 투자 감소 근거와 구분합니다.',source:'reuters'},
 {id:'investment',layer:'industry',name:'투자·기술 전환',definition:'AI·전력망·자동화 등 투자 방향과 기술 대체가 공급업체 주문으로 전달되는 경로.',indicators:'CAPEX 계획·실제 집행·수주'},
 {id:'revenue',layer:'company',name:'매출·주문',definition:'판매량·인도량·수주·고객 변화가 기업 매출 기대에 전달되는 경로.',indicators:'기업 공시·판매량·수주·전망',observation:'Tesla 인도량 / Nike 전망 보도',direction:'기업별 상반',path:'인도량·전망 변화 → 매출 기대 → TSLA / NKE',detail:'주가 수익률로 매출 변화 강도를 측정하지 않습니다. 기업 원문·예상치 확인이 추가로 필요합니다.',source:'reuters'},
 {id:'margin',layer:'company',name:'마진·현금흐름',definition:'가격·원가·재고·투자 부담이 이익과 현금 창출에 전달되는 경로.',indicators:'이익률·현금흐름·재고·투자 부담'},
 {id:'capital',layer:'company',name:'자본·기업 사건',definition:'증자·주주환원·M&A·소송·경영 변화가 기업 가치와 주주 몫을 바꾸는 경로.',indicators:'기업 공시·주주환원·거래 조건',observation:'NVIDIA 주초 자사주 매입 소식',direction:'주주환원 관련 배경',path:'자사주 매입 소식 → 주주환원 기대 → NVDA',detail:'주초 발표의 이월 배경이며 10월 2일 신규 사건이 아닙니다. 가격 영향은 미검증입니다.',source:'kip'},
].map(d=>({...d,score:activityScore(d.value,d.step),measurement:d.value==null?'정량 미확보':'원자료 기반 시험 구간'}));
export function pct(value,approximate=false){return `${approximate?'약 ':''}${value>0?'+':''}${value.toFixed(value===1.3||value===4.7||value===-3.6||Math.abs(value)===10?1:2)}%`;}
