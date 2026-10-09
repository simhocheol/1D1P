import React,{useEffect,useRef,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {readDeviceVault,subscribeDeviceVault} from './device-vault.js';
// Admin-only: asks GitHub Actions to refresh the home data (market pulse + long-run context) now.
// The browser calls GitHub directly with the admin token already stored, encrypted, on this device;
// the site's server never sees it. The token needs Actions: Read and write on the repository.
const REPO='simhocheol/1D1P';
const JOBS=[{file:'market-pulse.yml',inputs:{force:true}},{file:'market-context.yml'}];
const gh=(token,path,init={})=>fetch(`https://api.github.com/repos/${REPO}${path}`,{...init,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json',...(init.body?{'Content-Type':'application/json'}:{})}});
export default function CollectButton(){
 const [token,setToken]=useState(null),[state,setState]=useState({phase:'idle'}),timer=useRef(null);
 useEffect(()=>{const load=()=>readDeviceVault().then(v=>setToken(v.credentials?.token||null)).catch(()=>setToken(null));load();const off=subscribeDeviceVault(load);return()=>{off();clearInterval(timer.current)}},[]);
 if(!token)return null;
 async function run(){
  setState({phase:'starting'});const since=new Date(Date.now()-5000).toISOString();
  try{
   for(const j of JOBS){const r=await gh(token,`/actions/workflows/${j.file}/dispatches`,{method:'POST',body:JSON.stringify({ref:'main',...(j.inputs?{inputs:j.inputs}:{})})});
    if(r.status===401)throw Error('토큰이 만료됐거나 올바르지 않아요.');if(r.status===403||r.status===404)throw Error('관리자 토큰에 Actions 쓰기 권한(Read and write)이 필요해요.');if(!r.ok)throw Error(`GitHub 응답 ${r.status}`)}
   setState({phase:'running',since});
   // Poll the runs this click started until all finish.
   clearInterval(timer.current);timer.current=setInterval(async()=>{try{
    const d=await (await gh(token,`/actions/runs?event=workflow_dispatch&created=>=${since}&per_page=20`)).json();
    const runs=(d.workflow_runs||[]).filter(x=>JOBS.some(j=>x.path?.endsWith(j.file)));
    if(runs.length>=JOBS.length&&runs.every(x=>x.status==='completed')){clearInterval(timer.current);setState({phase:runs.every(x=>x.conclusion==='success')?'done':'failed'})}
   }catch{}},15000);
  }catch(e){setState({phase:'error',message:e.message})}
 }
 const busy=state.phase==='starting'||state.phase==='running';
 const label={idle:'데이터 수집',starting:'요청 중',running:'수집 중…',done:'수집 완료',failed:'일부 실패',error:'요청 실패'}[state.phase];
 return <div className="collect-btn"><button type="button" onClick={run} disabled={busy} aria-busy={busy}><RefreshCw size={14} className={busy?'spin':''}/>{label}</button>
  <small role="status">{state.phase==='running'?'시장 분위기·장기 지표를 수집하고 있어요(1~3분).':state.phase==='done'?'1~2분 뒤 새로고침하면 반영돼요.':state.phase==='failed'?'GitHub Actions 기록을 확인해 주세요.':state.phase==='error'?state.message:'관리자 전용'}</small></div>;
}
