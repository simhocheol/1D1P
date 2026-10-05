import React,{useEffect,useRef,useState} from 'react';
import {Button,Chip,Input,Label,TextField} from '@heroui/react';
import {ShieldCheck,RefreshCw,Unplug,FileText,Archive,X} from 'lucide-react';
import ReportView from './report-view.jsx';
import {readDeviceVault,updateDeviceVault,clearDeviceVault,subscribeDeviceVault} from './device-vault.js';
const ARCHIVE_LIMIT=30;
const archiveEntry=(report,loadedAt)=>({report,loadedAt});
function addToArchive(archive={},report,loadedAt){if(!report?.date)return archive;const next={...archive,[report.date]:archiveEntry(report,loadedAt)};return Object.fromEntries(Object.entries(next).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,ARCHIVE_LIMIT))}
export default function SignalReport(){
 const generation=useRef(0);
 const [token,setToken]=useState(''),[secret,setSecret]=useState(''),[connected,setConnected]=useState(false),[editing,setEditing]=useState(false),[ready,setReady]=useState(false);
 const [date,setDate]=useState(new URLSearchParams(location.search).get('date')||''),[report,setReport]=useState(null),[loadedAt,setLoadedAt]=useState(null),[error,setError]=useState(''),[pending,setPending]=useState(false),[limit,setLimit]=useState(20),[archive,setArchive]=useState({});
 useEffect(()=>{let active=true;readDeviceVault().then(v=>{if(!active)return;setConnected(!!(v.credentials?.token&&v.credentials?.secret));setArchive(v.archive||(v.snapshot?.report?addToArchive({},v.snapshot.report,v.snapshot.loadedAt):{}));if(v.snapshot){setReport(v.snapshot.report);setLoadedAt(v.snapshot.loadedAt);setLimit(v.snapshot.limit||20);if(!new URLSearchParams(location.search).has('date'))setDate(v.snapshot.date||'')}}).catch(()=>{if(active)setError('이 기기 저장 정보를 복원하지 못했습니다.')}).finally(()=>{if(active)setReady(true)});const unsubscribe=subscribeDeviceVault(kind=>{if(kind==='clear'){generation.current++;setConnected(false);setReport(null);setArchive({});setLoadedAt(null);setToken('');setSecret('');setEditing(false)}else readDeviceVault().then(v=>{if(active)setConnected(!!(v.credentials?.token&&v.credentials?.secret))}).catch(()=>{})});return()=>{active=false;unsubscribe()}},[]);
 async function load(e){
  e.preventDefault();if(pending)return;const requestGeneration=generation.current;setPending(true);setError('');
  try{
   const vault=await readDeviceVault();const auth=editing||!connected?{token:token.trim(),secret:secret.trim()}:vault.credentials;
   if(!auth?.token||!auth?.secret)throw Error('먼저 이 기기에서 조회 연결을 완료해 주세요.');
   const r=await fetch('/api/market-data',{method:'POST',headers:{Authorization:`Bearer ${auth.token}`,'Content-Type':'application/json'},body:JSON.stringify({secretKey:auth.secret,...(date?{date}:{})}),cache:'no-store'});
   const d=await r.json();if(!r.ok)throw Error(d.message);if(!d.report)throw Error('분석 결과가 없습니다.');
   if(requestGeneration!==generation.current)throw Error('기기 연결이 해제되어 조회를 중단했습니다.');
   const now=new Date().toISOString();const saved=await updateDeviceVault(v=>({...v,credentials:auth,snapshot:{report:d.report,loadedAt:now,date,limit:20},archive:addToArchive(v.archive,d.report,now)}));
   if(requestGeneration!==generation.current)return;setArchive(saved.archive||{});setReport(d.report);setLoadedAt(now);setLimit(20);setConnected(true);setEditing(false);
  }catch(e){setError(e.message||'리포트 조회 실패. 기존 결과는 유지됩니다.')}
  finally{setToken('');setSecret('');setPending(false)}
 }
 async function disconnect(){try{await clearDeviceVault();setConnected(false);setReport(null);setLoadedAt(null);setArchive({});setEditing(false);setError('')}catch{setError('기기 연결 삭제에 실패했습니다.')}}
 async function openArchived(day){const item=archive[day];if(!item)return;setReport(item.report);setLoadedAt(item.loadedAt);setDate(day);setLimit(20);setError('');try{await updateDeviceVault(v=>({...v,snapshot:{report:item.report,loadedAt:item.loadedAt,date:day,limit:20}}))}catch{}}
 async function removeArchived(day){try{const saved=await updateDeviceVault(v=>{const next={...(v.archive||{})};delete next[day];return {...v,archive:next}});setArchive(saved.archive||{})}catch{setError('보관 리포트를 삭제하지 못했습니다.')}}
 async function more(){const next=limit+20;setLimit(next);try{await updateDeviceVault(v=>({...v,snapshot:v.snapshot?{...v.snapshot,limit:next}:undefined}))}catch{setError('표시 위치를 보관하지 못했습니다.')}}
 const days=Object.keys(archive).sort((a,b)=>b.localeCompare(a));
 const sidebar=<aside className="report-archive" aria-label="보관된 리포트"><div className="report-archive-head"><Archive size={15}/><strong>보관된 리포트</strong><span>{days.length}</span></div>{days.length?<ul>{days.map(day=>{const r=archive[day].report,t=r.thesis;return <li key={day} className={report?.date===day?'is-active':''}><button type="button" onClick={()=>openArchived(day)} aria-current={report?.date===day?'true':undefined}><strong>{day}</strong><span>{t?`Driver ${t.drivers.filter(d=>d.status==='observed').length}/12 · 후보 ${t.candidates.length}`:'이전 형식'}</span><small>{new Date(archive[day].loadedAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})} 조회</small></button><button type="button" className="report-archive-remove" aria-label={`${day} 보관 리포트 삭제`} title="보관 삭제" onClick={()=>removeArchived(day)}><X size={13}/></button></li>})}</ul>:<p className="fine">조회한 리포트가 이 기기에 날짜별로 보관됩니다.</p>}<p className="fine">최근 {ARCHIVE_LIMIT}개 거래일 · 이 기기에 암호화 보관</p></aside>;
 return <div className="report-shell">{sidebar}<div className="report-body">
 <form onSubmit={load} className="report-toolbar" aria-label="리포트 내려받기"><div className="report-toolbar-date"><label htmlFor="report-date">거래일 · ET</label><Input id="report-date" aria-label="거래일 · ET" type="date" value={date} onChange={e=>setDate(e.target.value)} disabled={pending}/>{loadedAt&&<span className="signal-snapshot">마지막 조회 {new Date(loadedAt).toLocaleString('ko-KR')} · 보관된 결과</span>}</div><div className="signal-query-actions"><Button type="submit" variant="primary" isDisabled={!ready||pending||((!connected||editing)&&(!token.trim()||!secret.trim()))}><RefreshCw size={16}/>{pending?'조회 중':'리포트 조회'}</Button>{connected&&<Button type="button" variant="ghost" onPress={()=>setEditing(!editing)} isDisabled={pending}>연결 변경</Button>}<Button type="button" isIconOnly variant="ghost" aria-label="이 기기 연결 및 결과 삭제" title="이 기기 연결 및 결과 삭제" onPress={disconnect} isDisabled={pending}><Unplug size={16}/></Button></div></form>
 {(!connected||editing)&&ready&&<div className="signal-connect report-toolbar-connect"><TextField><Label>GitHub 관리자 토큰 · Actions: Read</Label><Input aria-label="GitHub 관리자 토큰 · Actions: Read" type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" disabled={pending}/></TextField><TextField><Label>리포트 복호화용 Alpaca Secret Key</Label><Input aria-label="리포트 복호화용 Alpaca Secret Key" type="password" value={secret} onChange={e=>setSecret(e.target.value)} autoComplete="off" disabled={pending}/></TextField><p className="fine">공용 기기에서는 조회 후 기기 연결을 삭제하세요.</p></div>}
 <main className="service-page research-page"><header className="research-heading"><h1>{report?.date?`${report.date} 일일 리포트`:'일일 리포트'}</h1><Chip variant="secondary"><ShieldCheck size={13}/>{connected?'기기 연결됨':'조회 연결 필요'}</Chip></header>
 {error&&<p role="alert">{error}</p>}
 {report?<ReportView key={loadedAt} report={report} limit={limit} onMore={more}/>:<div className="report-empty report-welcome"><FileText size={28}/><h2>일일 시장 리포트</h2><p>오늘의 Driver · 섹터 영향 · 근거가 있는 종목 후보</p><span>{ready?'아직 조회한 리포트가 없습니다.':'보관된 결과를 확인 중입니다.'}</span></div>}
 </main></div></div>;
}
