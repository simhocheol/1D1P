const bls='https://www.bls.gov/schedule/2026/10_sched.htm',fed='https://www.federalreserve.gov/monetarypolicy.htm';
export const calendarEvents=[
 {day:2,type:'economic',title:'미국 고용·실업률',time:'08:30 ET',source:'BLS',url:bls,drivers:['경기','금리'],note:'9월 고용 상황. 장후 리포트에 반응 기록이 있습니다.'},
 {day:7,type:'institution',title:'FOMC 회의록 공개',time:'시각 미확인',source:'Federal Reserve',url:fed,drivers:['금리','유동성'],note:'9월 15–16일 회의의 회의록 공개 일정.'},
 {day:14,type:'economic',title:'소비자물가지수 CPI',time:'08:30 ET',source:'BLS',url:bls,drivers:['금리','경기'],note:'9월 CPI 발표 예정.'},
 {day:14,type:'economic',title:'실질임금 발표',time:'08:30 ET',source:'BLS',url:bls,drivers:['소비','경기'],note:'9월 실질임금 발표 예정.'},
 {day:15,type:'economic',title:'생산자물가지수 PPI',time:'08:30 ET',source:'BLS',url:bls,drivers:['금리','경기'],note:'9월 PPI 발표 예정.'},
 {day:16,type:'economic',title:'수출입 물가지수',time:'08:30 ET',source:'BLS',url:bls,drivers:['달러','경기'],note:'9월 수출입 물가지수 발표 예정.'},
 {day:21,type:'earnings',title:'Tesla · TSLA 실적 발표',time:'미국 장 마감 후',source:'Tesla IR',url:'https://ir.tesla.com/press-release/tesla-third-quarter-2026-production-deliveries-and-deployments',drivers:['실적·기업','소비'],note:'기업 공식 공지에 따른 2026년 3분기 실적 예정일. 첨부 이미지와 달리 21일입니다.'},
 {day:27,type:'institution',title:'FOMC 회의 · 첫째 날',time:'시간 미지정',source:'Federal Reserve',url:fed,drivers:['금리','유동성'],note:'27–28일 이틀간 회의 예정.'},
 {day:28,type:'institution',title:'FOMC 회의 · 둘째 날',time:'발표 시각 미확인',source:'Federal Reserve',url:fed,drivers:['금리','유동성'],note:'회의 종료일. 결정 내용은 아직 없습니다.'},
 {day:29,type:'economic',title:'소비지출 연간 통계',time:'10:00 ET',source:'BLS',url:bls,drivers:['소비'],note:'2025년 연간 소비지출 통계. 월간 PCE와 다릅니다.'},
 {day:30,type:'economic',title:'고용비용지수 ECI',time:'08:30 ET',source:'BLS',url:bls,drivers:['금리','경기'],note:'2026년 3분기 고용비용지수 발표 예정.'},
].map((e,i)=>({...e,drivers:e.type==='earnings'?['매출·주문','마진·현금흐름']:e.title.includes('FOMC')?['금리·할인율','유동성·자금흐름']:e.title.includes('물가')||e.title.includes('ECI')?['물가·비용','금리·할인율']:['수요·성장'],id:`event-${i}`,date:`2026-10-${String(e.day).padStart(2,'0')}`,region:'US',checked:'2026-10-04'}));
export const driverSnapshots=[];
export function monthDays(y,m){return new Date(Date.UTC(y,m+1,0)).getUTCDate();}
