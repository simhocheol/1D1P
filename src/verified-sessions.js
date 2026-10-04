export const auditSources = {
  nike: {name:'NIKE IR · 공식 실적',url:'https://investors.nike.com/investors/news-events-and-reports/investor-news/investor-news-details/2026/NIKE-Inc--Reports-Fiscal-2027-First-Quarter-Results/default.aspx'},
  bls: {name:'BLS · 공식 고용 발표',url:'https://www.bls.gov/news.release/archives/empsit_10022026.htm'},
  tesla: {name:'Tesla IR · 공식 생산·인도',url:'https://ir.tesla.com/press-release/tesla-third-quarter-2026-production-deliveries-and-deployments'},
  close1: {name:'Kiplinger · 10월 1일 마감 보도',url:'https://www.kiplinger.com/investing/stocks/stocks-gain-as-treasury-yields-fluctuate-stock-market-today'},
  close2: {name:'Kiplinger · 10월 2일 마감 보도',url:'https://www.kiplinger.com/investing/stocks/nasdaq-adds-319-points-as-rate-hike-odds-ebb-stock-market-today'},
};
export const verifiedSessions = {
  '2026-10-01': {
    title:'금리 하락과 장후 기업 실적을 분리해서 관찰',
    markets:[['S&P 500','약 7,666 · +0.2%'],['Nasdaq','약 26,871 · +0.04%'],['Dow','약 50,926 · +0.04%'],['미국 10년물','5.234% · −5.9bp']],
    marketSource:'close1',
    warning:'지수는 마감 기사의 반올림값입니다. 다른 보도의 수치와 차이가 있어 소수점 종가는 보류했습니다. 국채 수익률은 기사 관측값이며 주식 거래소 종가와 동일한 개념이 아닙니다.',
    events:[{id:'nike-q1',releaseDate:'2026-10-01',reactionDate:'2026-10-02',timing:'장후 · 컨퍼런스콜 17:00 ET',source:'nike',name:'NIKE FY2027 1분기 실적',facts:'매출 112억 달러, 전년 대비 −4%. 매출총이익률 42.8%, +60bp. 희석 EPS 0.48달러. 연간 매출은 한 자릿수 후반 감소 전망.',drivers:['매출·주문','마진·현금흐름'],exposure:'NKE · 중국·EMEA 매출 및 직접 판매',hypothesis:'매출 전망의 약세는 부담, 비용 절감에 따른 마진 개선은 상쇄 요인. 실적을 단순한 마진 악화로 분류하지 않음.',reaction:'당일 정규장 반응으로 연결하지 않음. 다음 날 NKE −3.6%는 마감 보도 확인.',reactionSource:'close2'}],
    observations:[{driver:'금리·할인율',fact:'10년물 수익률 −5.9bp',reading:'할인율 부담 완화 가능성. 기업별 금리 민감도와 다른 사건을 함께 확인.',source:'close1'}],
  },
  '2026-10-02': {
    title:'고용 둔화와 기업별 사건이 서로 다른 경로로 작용',
    markets:[['S&P 500','약 7,723 · +0.7%'],['Nasdaq','약 27,191 · +1.2%'],['Dow','약 51,177 · +0.5%'],['미국 10년물','5.279% · +4.5bp']],
    marketSource:'close2',
    warning:'지수·종목 등락은 마감 보도 기반입니다. 고용 둔화에도 10년물 수익률은 전일 대비 상승했습니다. “고용 약세 → 금리 하락 → 주가 상승”으로 단정할 수 없습니다.',
    events:[
      {id:'jobs',releaseDate:'2026-10-02',reactionDate:'2026-10-02',timing:'08:30 ET · 장전',source:'bls',name:'9월 미국 고용 보고서',facts:'비농업 고용 +29,000명, 실업률 4.2%. 노동참가율 61.8%. 공식 자료에는 시장 예상치가 포함되지 않음.',drivers:['수요·성장','금리·할인율'],exposure:'시장 전반 · 소비 관련 기업과 장기 성장주',hypothesis:'고용 둔화는 수요에 부담이나 정책 기대에는 다른 영향을 줄 수 있음. 두 경로를 분리해서 관찰.',reaction:'Nasdaq 약 +1.2%, 10년물 +4.5bp. 동시 움직임만으로 고용 발표의 기여율을 추정하지 않음.',reactionSource:'close2'},
      {id:'tesla-deliveries',releaseDate:'2026-10-02',reactionDate:'2026-10-02',timing:'발표일 확인 · 정확한 공개 시각 미확인',source:'tesla',name:'Tesla 3분기 생산·인도 공개',facts:'생산 464,391대, 인도 486,532대, 에너지 저장 배치 13.7GWh. 인도량은 매출·이익과 동일하지 않음.',drivers:['매출·주문'],exposure:'TSLA · 자동차 인도와 에너지 사업',hypothesis:'물량은 사업 활동을 보여주지만 가격·제품 구성·마진 확인이 필요. 공식 발표만으로 예상 상회를 판정하지 않음.',reaction:'TSLA +4.7% 마감 보도. 인도 발표와 연결 가능하지만 단독 원인으로 확정하지 않음.',reactionSource:'close2'},
      {id:'nike-reaction',releaseDate:'2026-10-01',reactionDate:'2026-10-02',timing:'전일 장후 사건의 다음 거래일 반응',source:'nike',name:'NIKE 실적 이후 주가 반응',facts:'전일 발표: 매출 감소 전망과 매출총이익률 개선이 함께 존재.',drivers:['매출·주문','마진·현금흐름'],exposure:'NKE · 기업 고유 실적 전망',hypothesis:'시장 상승과 개별 기업 하락을 구분. 전망·밸류에이션·포지션의 기여율은 미추정.',reaction:'NKE −3.6%. 시장 전체 상승과 반대 방향.',reactionSource:'close2'},
    ],
    observations:[{driver:'수요·성장',fact:'비농업 고용 +29,000명',reading:'고용 증가 둔화 관측. 예상 대비 충격 점수는 검증된 컨센서스 시계열 확보 전 보류.',source:'bls'},{driver:'금리·할인율',fact:'10년물 수익률 +4.5bp',reading:'주가 상승과 수익률 상승이 공존. 금리 경로를 일방적인 호재로 표시하지 않음.',source:'close2'}],
  },
};
