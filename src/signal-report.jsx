import React,{useEffect,useRef,useState} from 'react';
import {Button,Chip,Input,Label,TextField} from '@heroui/react';
import {ShieldCheck,RefreshCw,Unplug,FileText} from 'lucide-react';
import ReportView from './report-view.jsx';
import {readDeviceVault,updateDeviceVault,clearDeviceVault,subscribeDeviceVault} from './device-vault.js';
export default function SignalReport(){
 const generation=useRef(0);
 const [token,setToken]=useState(''),[secret,setSecret]=useState(''),[connected,setConnected]=useState(false),[editing,setEditing]=useState(false),[ready,setReady]=useState(false);
 const [date,setDate]=useState(new URLSearchParams(location.search).get('date')||''),[report,setReport]=useState(null),[loadedAt,setLoadedAt]=useState(null),[error,setError]=useState(''),[pending,setPending]=useState(false),[limit,setLimit]=useState(20);
 useEffect(()=>{let active=true;readDeviceVault().then(v=>{if(!active)return;setConnected(!!(v.credentials?.token&&v.credentials?.secret));if(v.snapshot){setReport(v.snapshot.report);setLoadedAt(v.snapshot.loadedAt);setLimit(v.snapshot.limit||20);if(!new URLSearchParams(location.search).has('date'))setDate(v.snapshot.date||'')}}).catch(()=>{if(active)setError('이 기기 저장 정보를 복원하지 못했습니다.')}).finally(()=>{if(active)setReady(true)});const unsubscribe=subscribeDeviceVault(kind=>{if(kind==='clear'){generation.current++;setConnected(false);setReport(null);setLoadedAt(null);setToken('');setSecret('');setEditing(false)}else readDeviceVault().then(v=>{if(active)setConnected(!!(v.credentials?.token&&v.credentials?.secret))}).catch(()=>{})});return()=>{active=false;unsubscribe()}},[]);
 async function load(e){
  e.preventDefault();if(pending)return;const requestGeneration=generation.current;setPending(true);setError('');
  try{
   const vault=await readDeviceVault();const auth=editing||!connected?{token:token.trim(),secret:secret.trim()}:vault.credentials;
   if(!auth?.token||!auth?.secret)throw Error('먼저 이 기기에서 조회 연결을 완료해 주세요.');
   const r=await fetch('/api/market-data',{method:'POST',headers:{Authorization:`Bearer ${auth.token}`,'Content-Type':'application/json'},body:JSON.stringify({secretKey:auth.secret,...(date?{date}:{})}),cache:'no-store'});
   const d=await r.json();if(!r.ok)throw Error(d.message);if(!d.report)throw Error('분석 결과가 없습니다.');
   if(requestGeneration!==generation.current)throw Error('기기 연결이 해제되어 조회를 중단했습니다.');
   const now=new Date().toISOString();await updateDeviceVault(v=>({...v,credentials:auth,snapshot:{report:d.report,loadedAt:now,date,limit:20}}));
   if(requestGeneration!==generation.current)return;setReport(d.report);setLoadedAt(now);setLimit(20);setConnected(true);setEditing(false);
  }catch(e){setError(e.message||'리포트 조회 실패. 기존 결과는 유지됩니다.')}
  finally{setToken('');setSecret('');setPending(false)}
 }
 async function disconnect(){try{await clearDeviceVault();setConnected(false);setReport(null);setLoadedAt(null);setEditing(false);setError('')}catch{setError('기기 연결 삭제에 실패했습니다.')}}
 async function more(){const next=limit+20;setLimit(next);try{await updateDeviceVault(v=>({...v,snapshot:v.snapshot?{...v.snapshot,limit:next}:undefined}))}catch{setError('표시 위치를 보관하지 못했습니다.')}}
 return <main className="service-page research-page"><header className="research-heading"><div><span className="research-eyebrow">시장 리서치 / 일일 리포트</span><h1>오늘의 시장, 변화의 이유</h1><p>{report?.date||'최근 완료 거래일'} · Driver에서 종목까지</p></div><Chip variant="secondary"><ShieldCheck size={13}/>{connected?'기기 연결됨':'조회 연결 필요'}</Chip></header>
 <form onSubmit={load} className="signal-toolbar"><TextField><Label>거래일 · ET</Label><Input aria-label="거래일 · ET" type="date" value={date} onChange={e=>setDate(e.target.value)} disabled={pending}/></TextField><div className="signal-query-actions"><Button type="submit" variant="primary" isDisabled={!ready||pending||((!connected||editing)&&(!token.trim()||!secret.trim()))}><RefreshCw size={16}/>{pending?'조회 중':'리포트 조회'}</Button>{connected&&<Button type="button" variant="ghost" onPress={()=>setEditing(!editing)} isDisabled={pending}>연결 변경</Button>}<Button type="button" isIconOnly variant="ghost" aria-label="이 기기 연결 및 결과 삭제" title="이 기기 연결 및 결과 삭제" onPress={disconnect} isDisabled={pending}><Unplug size={16}/></Button></div></form>
 {(!connected||editing)&&ready&&<div className="signal-connect"><TextField><Label>GitHub 관리자 토큰 · Actions: Read</Label><Input aria-label="GitHub 관리자 토큰 · Actions: Read" type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" disabled={pending}/></TextField><TextField><Label>리포트 복호화용 Alpaca Secret Key</Label><Input aria-label="리포트 복호화용 Alpaca Secret Key" type="password" value={secret} onChange={e=>setSecret(e.target.value)} autoComplete="off" disabled={pending}/></TextField><p className="fine">공용 기기에서는 조회 후 기기 연결을 삭제하세요.</p></div>}
 {loadedAt&&<p className="signal-snapshot">마지막 조회 {new Date(loadedAt).toLocaleString('ko-KR')} · 보관된 결과</p>}{error&&<p role="alert">{error}</p>}
 {report?<ReportView key={loadedAt} report={report} limit={limit} onMore={more}/>:<div className="report-empty report-welcome"><FileText size={28}/><h2>일일 시장 리포트</h2><p>오늘의 Driver · 섹터 영향 · 근거가 있는 종목 후보</p><span>{ready?'아직 조회한 리포트가 없습니다.':'보관된 결과를 확인 중입니다.'}</span></div>}
 </main>;
}
