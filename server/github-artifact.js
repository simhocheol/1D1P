// Shared GitHub auth + private artifact download for admin-only endpoints.
import {unzipSync,strFromU8} from 'fflate';
export const OWNER='simhocheol',REPO='1D1P';
export async function authorize(fetchImpl,token){
 const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json'};
 const user=await fetchImpl('https://api.github.com/user',{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!user.ok)return {status:401,message:'관리자 토큰을 확인해 주세요.'};
 if((await user.json()).login?.toLowerCase()!==OWNER)return {status:403,message:`${OWNER} 계정만 조회할 수 있습니다.`};
 return {headers};
}
// Latest non-expired artifact by name → {fileName: Uint8Array}
export async function downloadArtifact(fetchImpl,headers,name,accept=()=>true){
 const list=await fetchImpl(`https://api.github.com/repos/${OWNER}/${REPO}/actions/artifacts?name=${encodeURIComponent(name)}&per_page=20`,{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!list.ok)return {status:403,message:'토큰에 Actions: Read 권한을 추가해 주세요.'};
 const artifact=(await list.json()).artifacts?.filter(a=>!a.expired).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at))[0];
 if(!artifact)return {status:404,message:'아직 보관된 파일이 없습니다.'};
 const redirect=await fetchImpl(`https://api.github.com/repos/${OWNER}/${REPO}/actions/artifacts/${artifact.id}/zip`,{headers,redirect:'manual',signal:AbortSignal.timeout(10000)});
 if(redirect.status!==302)throw Error('artifact redirect');
 const url=new URL(redirect.headers.get('location'));
 if(url.protocol!=='https:'||!(url.hostname.endsWith('.blob.core.windows.net')||url.hostname.endsWith('.githubusercontent.com')))throw Error('artifact host');
 const download=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!download.ok||Number(download.headers.get('content-length'))>50000000)throw Error('artifact size');
 const bytes=new Uint8Array(await download.arrayBuffer());if(bytes.length>50000000)throw Error('artifact size');
 return {files:unzipSync(bytes,{filter:f=>accept(f.name)&&f.originalSize<20000000}),text:strFromU8};
}
