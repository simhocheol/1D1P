// Typical ETFs that tend to draw money in a given state of an indicator. Descriptive examples, not picks.
// Level / global indicators: by position (high ≥ 70th percentile, low ≤ 30th). Direction: only when improving.
const E={SGOV:'0~3개월 미국 국채',BIL:'1~3개월 미국 국채',SHY:'1~3년 미국 국채',TLT:'20년 이상 장기 국채',TIP:'물가연동 국채',AGG:'미국 종합 채권',
 XLRE:'부동산 섹터',XLF:'금융 섹터',KRE:'지역 은행',XLP:'필수소비재',XLV:'헬스케어',XLE:'에너지 섹터',DBC:'원자재 종합',GLD:'금',
 QQQ:'나스닥 100',SMH:'반도체',IWM:'소형주',XLY:'경기소비재',XLI:'산업재',XLB:'소재',UUP:'달러 강세',EEM:'신흥국 주식',
 USMV:'저변동성 미국 주식',MGK:'초대형 성장주',VOO:'S&P 500',DXJ:'일본 수출주(엔 헤지)',FXY:'엔화',VGK:'유럽 주식',FXE:'유로화',
 MCHI:'중국 주식',XRT:'소매 업종',XHB:'주택 건설',ITB:'주택 건설사'};
const t=(...ids)=>ids.map(id=>[id,E[id]]);
export const levelHints={
 rate10:{high:{why:'이자가 높을 때는 위험 없이 높은 이자를 받으려는 돈이 몰려요.',etfs:t('SGOV','SHY','AGG')},low:{why:'금리가 낮을 때는 금리 하락에 강한 자산으로 돈이 가요.',etfs:t('TLT','XLRE','QQQ')}},
 real10:{high:{why:'물가를 빼고도 이자가 높아, 물가연동 국채·단기 국채가 매력적이에요.',etfs:t('TIP','SGOV')},low:{why:'실질 이자가 낮으면 금·성장주 같은 자산이 상대적으로 유리해요.',etfs:t('GLD','QQQ')}},
 curve:{high:{why:'장기 금리가 단기보다 충분히 높으면 은행이 돈을 더 벌어요.',etfs:t('XLF','KRE')},low:{why:'금리차가 작거나 뒤집히면 경기를 덜 타는 업종으로 돈이 가요.',etfs:t('XLP','XLV')}},
 breakeven:{high:{why:'물가가 오를 거라 보면 물가와 함께 오르는 자산이 주목받아요.',etfs:t('TIP','GLD','DBC')},low:{why:'물가 걱정이 작으면 장기 채권이 편해져요.',etfs:t('TLT')}},
 cpi:{high:{why:'물가가 높을 때는 가격을 올릴 수 있는 에너지·원자재가 버텨요.',etfs:t('XLE','DBC','TIP')},low:{why:'물가가 안정되면 금리 하락 기대로 장기 채권·성장주가 유리해요.',etfs:t('TLT','QQQ')}},
 policy:{high:{why:'기준금리가 높으면 초단기 국채만으로도 높은 이자를 받아요.',etfs:t('SGOV','BIL')},low:{why:'기준금리가 낮으면 돈 빌리는 비용이 싸서 소형주·부동산이 유리해요.',etfs:t('IWM','XLRE')}},
 unemp:{low:{why:'일자리가 튼튼하면 소비와 생산이 늘어 경기 민감 업종이 유리해요.',etfs:t('XLY','XLI')},high:{why:'실업이 늘면 경기를 덜 타는 업종으로 돈이 가요.',etfs:t('XLP','XLV')}},
 dollar:{high:{why:'달러가 강하면 해외 매출이 적은 내수 기업과 달러 자산이 유리해요.',etfs:t('UUP','IWM')},low:{why:'달러가 약하면 미국 밖 주식과 금이 유리해져요.',etfs:t('EEM','GLD')}},
 vix:{low:{why:'시장이 차분하면 성장주·반도체처럼 위험을 감수하는 쪽으로 돈이 가요.',etfs:t('QQQ','SMH')},high:{why:'불안이 크면 변동이 작은 주식이나 금으로 피해요.',etfs:t('USMV','XLP','GLD')}},
 stocks:{high:{why:'주가가 높을 때는 이미 잘 오른 대형주로 쏠리거나, 변동이 작은 주식으로 나눠 담는 경향이 있어요.',etfs:t('MGK','USMV')},low:{why:'주가가 낮을 때는 지수 전체를 싸게 사려는 돈이 들어와요.',etfs:t('VOO','IWM')}},
 krw:{high:{why:'환율이 높을 때는 새로 달러를 바꾸기보다, 이미 가진 달러를 단기 국채에 두려는 경향이 있어요.',etfs:t('SGOV','BIL')},low:{why:'환율이 낮으면 달러를 싸게 바꿔 미국 지수에 넣기 좋아요.',etfs:t('VOO','QQQ')}},
 jpy:{high:{why:'엔화가 약하면 해외에 많이 파는 일본 수출 기업이 유리해요.',etfs:t('DXJ')},low:{why:'엔화가 강해지는 쪽에 거는 돈이 엔화로 가요.',etfs:t('FXY')}},
 eur:{high:{why:'유로가 강하면 유럽 주식과 유로화가 주목받아요.',etfs:t('VGK','FXE')},low:{why:'유로가 약하면 상대적으로 달러 자산이 유리해요.',etfs:t('UUP')}},
 cny:{low:{why:'위안이 강하면 중국 경기 자신감으로 읽혀 중국 주식이 주목받아요.',etfs:t('MCHI')},high:{why:'위안이 약하면 달러 자산으로 돈이 가는 경향이 있어요.',etfs:t('UUP')}},
 jp10:{high:{why:'일본 금리가 오르면 엔화 강세를 기대하는 돈이 엔화로 가요.',etfs:t('FXY')},low:{why:'일본 금리가 낮으면 엔화를 빌려 해외에 투자하는 흐름이 이어져요.',etfs:t('DXJ')}},
 de10:{low:{why:'유럽 금리가 낮으면 유럽 주식이 상대적으로 유리해요.',etfs:t('VGK')},high:{why:'유럽 금리가 높으면 유로화 표시 채권 매력이 커져 유로가 받쳐져요.',etfs:t('FXE')}},
 usjp:{high:{why:'미·일 금리차가 크면 엔화를 빌려 미국 자산을 사는 흐름이 커져요.',etfs:t('DXJ','QQQ')},low:{why:'금리차가 좁으면 그 돈이 되돌아갈 수 있어 엔화·금 같은 피난처가 주목받아요.',etfs:t('FXY','GLD')}},
};
export const directionHints={
 claims:{why:'실업수당 신청이 줄면 고용이 튼튼하다는 뜻이라 경기 민감 업종이 유리해요.',etfs:t('IWM','XLY')},
 payrolls:{why:'일자리가 빠르게 늘면 소비가 늘어 소비·소형주가 유리해요.',etfs:t('XLY','IWM')},
 retail:{why:'소비가 늘면 소매·경기소비재 기업의 매출이 늘어요.',etfs:t('XRT','XLY')},
 industry:{why:'생산이 늘면 공장·원자재 관련 기업이 유리해요.',etfs:t('XLI','XLB')},
 permits:{why:'집 짓기 허가가 늘면 주택 건설 관련 기업이 유리해요.',etfs:t('XHB','ITB')},
 sentiment:{why:'가계 심리가 좋아지면 지갑이 열려 소비 관련 기업이 유리해요.',etfs:t('XLY','XRT')},
};
export function levelHint(item){const h=levelHints[item?.id];if(!h||item.percentile==null)return null;return item.percentile>=70?h.high||null:item.percentile<=30?h.low||null:null}
export function directionHint(item){return item?.trend==='up'?directionHints[item.id]||null:null}
