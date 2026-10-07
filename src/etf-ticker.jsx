import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
// ETF ticker with a hover/tap popover showing the 1-year chart.
// The chart is TradingView's free embed widget: the viewer's browser loads it from TradingView,
// so this site does not redistribute licensed prices.
function chartUrl(symbol){
 // Bare tickers: TradingView resolves the listing exchange itself (prefixes like AMEX: fail for some ETFs).
 const cfg={symbol,width:'100%',height:'100%',locale:'kr',dateRange:'12M',colorTheme:'dark',isTransparent:true,autosize:true,largeChartUrl:'',chartOnly:false,noTimeScale:false};
 return `https://s.tradingview.com/embed-widget/mini-symbol-overview/?locale=kr#${encodeURIComponent(JSON.stringify(cfg))}`;
}
function Popover({symbol,name,anchor,onEnter,onLeave}){
 const r=anchor.getBoundingClientRect(),w=320,h=300;
 const left=Math.min(Math.max(8,r.left+r.width/2-w/2),innerWidth-w-8),below=r.bottom+h+8<innerHeight;
 return createPortal(<div className="etf-pop" role="dialog" aria-label={`${symbol} 최근 1년 차트`} style={{left,top:below?r.bottom+6:r.top-h-6,width:w,height:h}} onMouseEnter={onEnter} onMouseLeave={onLeave}>
  <div className="etf-pop-head"><strong>{symbol}</strong><span>{name}</span></div>
  <iframe title={`${symbol} 1년 차트`} src={chartUrl(symbol)} loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups"/>
  <small>최근 1년 · 차트 제공 TradingView</small>
 </div>,document.body);
}
export default function EtfTicker({symbol,name,variant='text'}){
 const ref=useRef(null),timer=useRef(null),[open,setOpen]=useState(false);
 const show=()=>{clearTimeout(timer.current);timer.current=setTimeout(()=>setOpen(true),180)};
 const hide=()=>{clearTimeout(timer.current);timer.current=setTimeout(()=>setOpen(false),200)};
 useEffect(()=>{if(!open)return;const close=e=>{if(!ref.current?.contains(e.target)&&!e.target.closest?.('.etf-pop'))setOpen(false)};const esc=e=>{if(e.key==='Escape')setOpen(false)};addEventListener('pointerdown',close);addEventListener('keydown',esc);addEventListener('scroll',hide,true);return()=>{removeEventListener('pointerdown',close);removeEventListener('keydown',esc);removeEventListener('scroll',hide,true)}},[open]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 // A span (not a button) so it can sit inside row buttons; tap toggles on touch screens.
 return <span ref={ref} className={`etf-tk ${variant}`} tabIndex={0} role="button" aria-label={`${symbol} ${name||''} 차트 보기`} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onClick={e=>{e.stopPropagation();e.preventDefault();setOpen(o=>!o)}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();setOpen(o=>!o)}}}>
  {symbol}{variant==='chip'&&name&&<small>{name}</small>}
  {open&&ref.current&&<Popover symbol={symbol} name={name} anchor={ref.current} onEnter={()=>clearTimeout(timer.current)} onLeave={hide}/>}
 </span>;
}
export function EtfList({etfs,variant='text',sep=' · '}){return etfs.map(([t,n],i)=><React.Fragment key={t}>{i>0&&variant==='text'&&sep}<EtfTicker symbol={t} name={n} variant={variant}/></React.Fragment>)}
