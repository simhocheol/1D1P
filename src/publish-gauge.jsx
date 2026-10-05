import React,{useEffect,useState} from 'react';
import {Sun,Moon} from 'lucide-react';
import {slotWindow} from './publish-schedule.js';
const SLOTS=[{id:'am',hour:9,minute:15,Icon:Sun,title:'장 시작 전 리포트',sub:'미국 아침 · 한국 밤'},{id:'pm',hour:17,minute:15,Icon:Moon,title:'장 마감 후 리포트',sub:'미국 저녁 · 한국 아침'}];
const kst=t=>t.toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'});
const left=ms=>{const m=Math.max(0,Math.round(ms/60000)),d=Math.floor(m/1440),h=Math.floor(m%1440/60);return d?`${d}일 ${h}시간`:h?`${h}시간 ${m%60}분`:`${m%60}분`};
export default function PublishGauges(){
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const id=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(id)},[]);
 return <section className="publish-gauges" aria-label="리포트 자동 발행 예정">{SLOTS.map(({id,hour,minute,Icon,title,sub})=>{const {prev,next}=slotWindow(now,hour,minute);const ratio=prev&&next?(now-prev)/(next-prev):0;return <div key={id} className={`publish-gauge ${id}`}><span className="publish-icon"><Icon size={18}/></span><div className="publish-body"><div className="publish-top"><strong>{title}</strong><span>{sub}</span><em>{left(next-now)} 후</em></div><div className="publish-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio*100)} aria-label={`${title}까지 진행률`}><i style={{width:`${Math.min(100,ratio*100)}%`}}/></div><small>다음 발행 {kst(next)} KST · {String(hour).padStart(2,'0')}:{String(minute).padStart(2,'0')} ET · 평일 · 실행 지연 가능</small></div></div>})}</section>;
}
