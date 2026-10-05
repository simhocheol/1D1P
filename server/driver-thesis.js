import {drivers as taxonomy} from '../src/framework.js';
import {association} from './market-metrics.js';

const topics = {
 demand: /\b(employment|payrolls|retail sales|gdp|consumer spending|unemployment)\b/i,
 cost: /\b(inflation|cpi|ppi|oil prices|crude prices|input costs)\b/i,
 rates: /\b(interest rates?|rate cuts?|rate hikes?|monetary policy|treasury yields?)\b/i,
 credit: /\b(credit spreads?|loan standards?|refinancing|defaults?)\b/i,
 liquidity: /\b(quantitative tightening|quantitative easing|balance sheet runoff|fund flows?)\b/i,
 fx: /\b(exchange rates?|currency|dollar strength|dollar weakness)\b/i,
 policy: /\b(tariffs?|sanctions?|regulat\w*|enforcement|export controls?)\b/i,
 supply: /\b(production cuts?|supply disruption|capacity expansion|shortages?)\b/i,
 investment: /\b(capex|capital expenditure|ai spending|data center investment)\b/i,
 revenue: /\b(revenue|sales|orders|deliveries|guidance|forecast)\b/i,
 margin: /\b(earnings|profit|margin|cash flow|eps)\b/i,
 capital: /\b(buybacks?|repurchase|dividend|offering|acquisition|merger|dilution)\b/i,
};
const fmt = v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
const unique = items => [...new Map(items.map(item => [item.url || item.title, item])).values()];
const safe = item => item?.title && /^https:\/\//i.test(item.url || '');
const channels = {
 rates: {
  'Information Technology': [1,'금리 하락 방향은 미래 이익의 할인 부담 완화와 연결될 수 있습니다.'],
  'Communication Services': [1,'금리 하락 방향은 장기 성장 현금흐름의 할인 부담 완화와 연결될 수 있습니다.'],
  'Consumer Discretionary': [1,'금리 하락 방향은 소비자 금융 부담과 성장주 할인율 완화로 전달될 수 있습니다.'],
  'Real Estate': [1,'금리 하락 방향은 부동산 차환 비용과 자산 할인율 완화로 전달될 수 있습니다.'],
  Utilities: [1,'금리 하락 방향은 자본집약 사업의 조달 부담 완화와 배당 자산 수요로 전달될 수 있습니다.'],
 },
 cost: {
  Energy: [1,'원유 가격 상승 방향은 에너지 생산자의 판매가격·수익 기대에 유리할 수 있습니다.'],
  Industrials: [-1,'원유 가격 상승 방향은 운송·생산 에너지 비용 부담으로 전달될 수 있습니다.'],
  'Consumer Discretionary': [-1,'원유 가격 상승 방향은 물류 비용과 가계 가처분소득 부담으로 전달될 수 있습니다.'],
  'Consumer Staples': [-1,'원유 가격 상승 방향은 물류·포장·생산 비용 부담으로 전달될 수 있습니다.'],
 },
};

function mentionsCompany(title, stock) {
 const escaped = stock.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
 if (new RegExp(`^${escaped}(?:$|[^a-zA-Z0-9])`).test(title.trim())) return true;
 const name = (stock.name || '').replace(/\b(incorporated|corporation|company|holdings|inc|corp|ltd|plc)\b\.?/gi, '').replace(/[,\s.]+$/g,'').trim();
 return name.length >= 4 && title.trim().toLowerCase().startsWith(name.toLowerCase()) && !/[a-z]/i.test(title.trim()[name.length] || '');
}

// Only explicit company fundamentals qualify; price-action headlines are not causes.
function companyDirection(title, id) {
 const rules = {
  revenue: [/(?:revenue|sales|deliveries|orders)\s+(?:beat\w*|exceed\w*)|(?:rais\w*|boost\w*)\s+(?:(?:its|annual|full.year|revenue|sales)\s+){0,3}(?:guidance|forecast|outlook)/i, /(?:revenue|sales|deliveries|orders)\s+(?:miss\w*|fall\w* short)|(?:cut\w*|lower\w*)\s+(?:(?:its|annual|full.year|revenue|sales)\s+){0,3}(?:guidance|forecast|outlook)/i],
  margin: [/(?:earnings|eps|profit)\s+(?:beat\w*|exceed\w*)/i, /(?:earnings|eps|profit)\s+(?:miss\w*|fall\w* short)/i],
  capital: [/(?:announc\w*|authoriz\w*)\s+(?:(?:a|new|stock|share|\$[\d.]+|billion|million)\s+){0,6}(?:buyback|repurchase)/i, /(?:announc\w*|launch\w*)\s+(?:(?:a|new|public|stock|share|\$[\d.]+|billion|million)\s+){0,6}(?:offering|dilution)/i],
 };
 if (!rules[id] || /\b(may|might|could|expects?|expected|preview|will|not|no)\b|\?/i.test(title)) return 0;
 const [up, down] = rules[id].map(rule => rule.test(title));
 return up === down ? 0 : up ? 1 : -1;
}

export function buildDriverThesis({report, rows, windowNews}) {
 const observations = unique([...report.events, ...Object.values(windowNews).flat()].filter(safe));
 const drivers = taxonomy.map(d => {
  const evidence = observations.filter(e => topics[d.id].test(e.title));
  const proxySymbol = {rates:'TLT', cost:'USO'}[d.id];
  const proxy = report.drivers.find(p => p.symbol === proxySymbol);
  const macro = (report.macro || []).filter(m => m.driver === d.id);
  const macroActive = macro.filter(m => m.active);
  return {...d, evidence, proxy, macro, status:proxy?.active || macroActive.length || evidence.length ? 'observed' : proxy?.change != null || macro.length ? 'quiet' : 'unknown', sectorIds:[], candidateSymbols:[]};
 });
 const candidates = report.stocks.flatMap(stock => {
  const sector = report.sectors.find(s => s.name === stock.sector);
  const paths = [];
  for (const driver of drivers) {
   const proxy = driver.proxy;
   const sectorExposure = sector?.candidates.find(c => c.symbol === proxy?.symbol);
   const channel = channels[driver.id]?.[stock.sector];
   if (proxy?.active && sectorExposure && channel && Math.sign(sectorExposure.beta) === channel[0]) {
    const exposure = association((rows[stock.symbol] || []).slice(0,-1), (rows[proxy.symbol] || []).slice(0,-1));
    if (exposure && Math.abs(exposure.correlation) >= .35 && Math.sign(exposure.beta) === channel[0] && Math.sign(exposure.beta * proxy.change) === Math.sign(stock.change)) {
     paths.push({driverId:driver.id, scope:'sector', basis:'통계적 동반 반응',
      reason:`${proxy.symbol} ${fmt(proxy.change)} 변화와 ${sector.symbol} ${fmt(sector.change)}, ${stock.symbol} ${fmt(stock.change)}의 방향이 각각의 과거 노출 관계와 일치합니다.`,
      transmission:channel[1]+' 반대 방향에서는 역경로를 가정합니다. 이 경로는 경제적 가설입니다.',
      exposure, sectorExposure:{correlation:sectorExposure.correlation,samples:sectorExposure.samples}, evidence:[],
      caution:'시장 공통 요인도 상관관계를 만들 수 있습니다. 단일 변수 상관은 원인이나 영향 기여도를 입증하지 않습니다.'});
    }
   }
   if (driver.layer !== 'company') continue;
   const evidence = (windowNews[stock.symbol] || []).filter(e => safe(e) && mentionsCompany(e.title, stock) && topics[driver.id].test(e.title));
   const directional = evidence.map(e => ({...e, direction:companyDirection(e.title,driver.id)})).filter(e => e.direction);
   const signs = new Set(directional.map(e => e.direction));
   if (signs.size === 1 && signs.has(Math.sign(stock.change))) {
    paths.push({driverId:driver.id,scope:'company',basis:'기업 뉴스·가격 방향 일치',evidence:directional,
     reason:`${stock.symbol}의 ${driver.name} 관련 명시적 기업 뉴스와 당일 ${fmt(stock.change)} 반응의 방향이 일치합니다. ${stock.reasons.join(', ')}도 충족했습니다.`,
     transmission:`${driver.name} 관련 기업 사건 → ${stock.sector} 내 해당 기업 → 개별 주가 반응`,
     caution:'제목에서 확인한 사건과 가격의 정합성입니다. 원문·발표 시각·기대치 확인이 필요하며 섹터 전체의 영향으로 일반화하지 않습니다.'});
   }
  }
  return paths.length ? [{...stock,paths}] : [];
 });
 const sectors = report.sectors.flatMap(sector => {
  const members = candidates.filter(c => c.sector === sector.name);
  const sectorDrivers = drivers.filter(d => d.proxy?.active && channels[d.id]?.[sector.name] && sector.candidates.some(c => c.symbol === d.proxy.symbol && Math.sign(c.beta) === channels[d.id][sector.name][0])).map(d => d.id);
  const companyDrivers = [...new Set(members.flatMap(c => c.paths.filter(p => p.scope === 'company').map(p => p.driverId)))];
  if (!sectorDrivers.length && !companyDrivers.length) return [];
  const explanations=sectorDrivers.map(id=>({driverId:id,text:channels[id][sector.name][1],correlation:sector.candidates.find(c=>c.symbol===drivers.find(d=>d.id===id).proxy.symbol).correlation}));
  return [{...sector,driverIds:[...new Set([...sectorDrivers,...companyDrivers])],sectorDriverIds:sectorDrivers,companyDriverIds:companyDrivers,explanations,candidateSymbols:members.map(c => c.symbol)}];
 });
 for (const driver of drivers) {
  driver.sectorIds = sectors.filter(s => s.driverIds.includes(driver.id)).map(s => s.name);
  driver.candidateSymbols = candidates.filter(c => c.paths.some(p => p.driverId === driver.id)).map(c => c.symbol);
 }
 return {version:2,drivers,sectors,candidates,unexplainedCount:report.stocks.length-candidates.length,
  newsSymbols:Object.keys(windowNews).filter(s => windowNews[s].length).length,
  rules:'1% 이상 변동 + (2σ 이상 / 거래량 2배 / 섹터 대비 1.5%p) + Driver 연결 조건. 거시 연결은 사전 정의된 경제적 경로와 섹터·종목 각각의 상관 방향이 모두 일치해야 합니다. 상관 표본 30~60개, |r| ≥ 0.35, 관측 당일 제외. 기업 뉴스는 제목의 명시적 호재·악재와 가격 방향이 일치할 때만 후보화.'};
}
