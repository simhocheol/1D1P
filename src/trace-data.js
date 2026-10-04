const recordedLinks=[
 {id:'market',drivers:['경기','금리','Nasdaq'],stocks:['NVDA','TSLA'],kind:'시장 공통 배경',title:'고용 예상 하회와 시장 반등',fact:'고용 +29,000명, Reuters 예상 +90,000명. Nasdaq +1.19%.',path:'고용 둔화 → 긴축 기대 완화 → 위험 선호 변화',limit:'동반 관측·보도상의 설명입니다. 개별 종목 상승의 원인별 기여율은 미검증입니다.',source:'reuters',time:'고용 08:30 EDT · 가격은 정규장 마감'},
 {id:'nvda',drivers:['실적·기업'],stocks:['NVDA'],kind:'기업 관련 배경',title:'NVIDIA 자사주 매입 확대',fact:'마감 보도에서 주초 발표된 자사주 매입 확대를 배경으로 언급했습니다.',path:'주주환원 기대 → 기업 기대 재평가',limit:'당일 새 발표가 아니며, AI CAPEX 변화나 상승의 단독 원인으로 확정하지 않습니다.',source:'kip',time:'주초 발표 · 10월 2일 기사에서 언급'},
 {id:'tesla',drivers:['실적·기업','소비'],stocks:['TSLA'],kind:'기업 이벤트 보도',title:'Tesla 인도량 예상 상회',fact:'분기 인도량 예상 상회 소식과 주가 상승이 보도됐습니다.',path:'인도량 → 매출 기대 → 전기차·경기소비재',limit:'기업 공시 원문과 발표 직후 가격·거래량 검증은 미완료입니다.',source:'kip',time:'마감 보도 기준 · 발표 시각 미확인'},
 {id:'nike',drivers:['실적·기업','소비'],stocks:['NKE'],kind:'기업 이벤트 보도',title:'Nike 전망·중국 수요 부담',fact:'매출 전망 부담과 중국 사업 약세가 보도됐습니다. 섹터 +1.4%와 종목 −3.6%가 공존했습니다.',path:'매출 전망 악화 → 이익 기대 조정 → 종목 약세',limit:'섹터 상승을 개별 기업에 적용할 수 없습니다. 요인별 가격 기여도는 미검증입니다.',source:'reuters',time:'마감 보도 기준 · 발표 시각 미확인'},
 {id:'storage',drivers:['실적·기업'],stocks:['WDC','STX'],kind:'산업 이벤트 보도',title:'Toshiba HDD 생산능력 확대 계획',fact:'생산 확대 보도와 함께 WDC·STX가 약 10% 하락한 것으로 보도됐습니다.',path:'공급 경쟁 가능성 → 가격·마진 우려 → HDD 업체 약세',limit:'AI 테마 관련 소식이지만 AI CAPEX 감소 근거는 아닙니다. 경쟁사 원문·장중 반응은 추가 확인이 필요합니다.',source:'reuters',time:'마감 보도 기준 · 발표 시각 미확인'},
];
const connectionDetails={
 market:{drivers:['수요·성장','금리·할인율'],exposure:'매출 기대와 미래 현금흐름 할인율에 대한 공통 시장 배경. 기업별 민감도는 미추정.',assessment:'시장 동반 상승과 방향 부합 · 원인 기여율 미검증',confidence:'공식 고용 + 마감 보도'},
 nvda:{drivers:['자본·기업 사건'],exposure:'자사주 매입 관련 주주환원 경로. 규모·집행·주식 수 변화 원문 검증 필요.',assessment:'연관 배경 · 당일 신규 사건 아님',confidence:'마감 보도 · 기업 원문 미확보'},
 tesla:{drivers:['매출·주문'],exposure:'차량 인도량이 자동차 매출 기대에 연결. ASP·마진·사업별 비중은 미확인.',assessment:'가격 방향 부합 · 인도량만으로 이익 개선 단정 불가',confidence:'기업 이벤트 보도 · 예상치 추가 확인'},
 nike:{drivers:['매출·주문'],exposure:'중국 사업 수요와 매출 전망에 대한 노출. 지역별 매출 비중·환헤지는 미확인.',assessment:'섹터와 반대 반응 · 기업 설명 후보와 방향 부합',confidence:'마감 보도 · 전망 원문 추가 확인'},
 storage:{drivers:['공급·경쟁 구조'],exposure:'HDD 업체의 공급 경쟁·가격 결정력에 대한 노출 가설. 마진 감소는 아직 관측되지 않음.',assessment:'하락 방향 부합 · 수익률은 약 −10% 근사값',confidence:'산업 이벤트 보도 · 경쟁사 원문 추가 확인'},
};
export const evidenceLinks=recordedLinks.map(e=>({...e,...connectionDetails[e.id],strength:'정량 미확보',exposureLevel:'정성 연결 · 규모 미추정'}));
