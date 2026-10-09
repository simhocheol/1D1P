import React from 'react';
// Quote cards. Market quotes come from TradingView's free embed widget, loaded by the viewer's browser
// (this site does not redistribute licensed prices). Symbols are ones the free widget actually serves:
// exchange indices, futures and bond yields are not, so indices use CFDs that track them and the bond
// tab is drawn from FRED (US Treasury / Fed data, public domain).
export const quoteTabs=[
 {id:'index',label:'지수·환율',note:'주가지수는 지수를 따라가는 CFD 시세예요. 시세·차트 제공 TradingView, 제공처 사정에 따라 지연될 수 있어요.',sections:[
  {label:'주가지수',items:[{label:'나스닥 100',symbol:'FOREXCOM:NSXUSD',flag:'🇺🇸'},{label:'S&P 500',symbol:'FOREXCOM:SPXUSD',flag:'🇺🇸'},{label:'다우존스',symbol:'FOREXCOM:DJI',flag:'🇺🇸'},{label:'러셀 2000',symbol:'FOREXCOM:US2000',flag:'🇺🇸'},{label:'VIX 공포지수',symbol:'CAPITALCOM:VIX',flag:'📉'}]},
  {label:'환율',items:[{label:'달러 인덱스',symbol:'CAPITALCOM:DXY',flag:'💵'},{label:'원/달러',symbol:'FX_IDC:USDKRW',flag:'🇰🇷'},{label:'엔/달러',symbol:'OANDA:USDJPY',flag:'🇯🇵'},{label:'유로/달러',symbol:'FX:EURUSD',flag:'🇪🇺'},{label:'유로/원',symbol:'FX_IDC:EURKRW',flag:'🇪🇺'}]}]},
 {id:'bonds',label:'채권',note:'채권 금리는 미국 재무부·연준 공식 자료(FRED)로 하루 한 번 갱신돼요. 실시간 금리는 무료 위젯에서 제공되지 않아요.',sections:[{label:'미국 국채 금리',bonds:true}]},
 {id:'commodity',label:'원자재',note:'원자재는 선물을 따라가는 CFD 시세예요. 시세·차트 제공 TradingView, 제공처 사정에 따라 지연될 수 있어요.',sections:[
  {label:'에너지',items:[{label:'WTI 원유',symbol:'TVC:USOIL',flag:'🛢️'},{label:'브렌트유',symbol:'TVC:UKOIL',flag:'🛢️'},{label:'천연가스',symbol:'OANDA:NATGASUSD',flag:'🔥'}]},
  {label:'금속',items:[{label:'금',symbol:'TVC:GOLD',flag:'🥇'},{label:'은',symbol:'OANDA:XAGUSD',flag:'🥈'},{label:'구리',symbol:'OANDA:XCUUSD',flag:'🟫'}]},
  {label:'곡물',items:[{label:'옥수수',symbol:'OANDA:CORNUSD',flag:'🌽'},{label:'밀',symbol:'OANDA:WHEATUSD',flag:'🌾'},{label:'대두',symbol:'OANDA:SOYBNUSD',flag:'🫘'}]}]},
 {id:'crypto',label:'가상자산',note:'가상자산은 24시간 거래돼요. 시세·차트 제공 TradingView(거래소 Bitstamp·Coinbase·Upbit).',sections:[
  {label:'달러 시세',items:[{label:'비트코인',symbol:'BITSTAMP:BTCUSD',flag:'₿'},{label:'이더리움',symbol:'COINBASE:ETHUSD',flag:'◆'},{label:'솔라나',symbol:'COINBASE:SOLUSD',flag:'◎'},{label:'리플',symbol:'COINBASE:XRPUSD',flag:'✕'}]},
  {label:'원화 시세',items:[{label:'비트코인(원)',symbol:'UPBIT:BTCKRW',flag:'₿'},{label:'이더리움(원)',symbol:'UPBIT:ETHKRW',flag:'◆'}]}]},
];
const widget=symbol=>`https://s.tradingview.com/embed-widget/mini-symbol-overview/?locale=kr#${encodeURIComponent(JSON.stringify({symbol,width:'100%',height:'100%',dateRange:'1D',colorTheme:'dark',isTransparent:true,autosize:true,noTimeScale:true}))}`;
export function QuoteCard({label,symbol,flag}){
 return <article className="quote-card"><header><span className="quote-flag" aria-hidden="true">{flag}</span><strong>{label}</strong></header>
  <iframe title={`${label} 시세`} src={widget(symbol)} loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups"/></article>;
}
function Spark({values}){
 if(!values?.length)return null;const min=Math.min(...values),max=Math.max(...values),r=max-min||1;
 const pts=values.map((v,i)=>`${(i/(values.length-1)*100).toFixed(1)},${(30-(v-min)/r*28).toFixed(1)}`).join(' ');
 return <svg className="quote-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points={pts}/></svg>;
}
export function BondCard({bond}){
 const up=bond.change>0,dn=bond.change<0,bp=Math.round(Math.abs(bond.change)*100);
 return <article className="quote-card bond"><header><span className="quote-flag" aria-hidden="true">🇺🇸</span><strong>{bond.label}</strong><span className="quote-fresh">{bond.asOf.slice(5).replace('-','/')} 기준</span></header>
  <div className="bond-body"><div><b className="bond-value">{bond.value.toFixed(2)}{bond.unit}</b><span className={`bond-change ${up?'up':dn?'down':''}`}>{up?'▲':dn?'▼':'–'} {bp}bp</span></div><Spark values={bond.spark}/></div>
  <small className="bond-src">최근 30거래일 · FRED</small></article>;
}
