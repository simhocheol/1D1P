import {unzipSync,strFromU8} from 'fflate';
import {respond,allowedOrigin,readBody} from '../server/request.js';
import {open} from '../server/market-vault.js';
export function makeHandler({fetchImpl=fetch,env=process.env}={}){return async(req,res)=>{
 if(req.method!=='POST')return respond(res,405,{message:'POST 요청만 지원합니다.'});
 if(!allowedOrigin(req.headers.origin,env))return respond(res,403,{message:'허용된 사이트에서 요청해 주세요.'});
 const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_]{20,300})$/)?.[1];
 if(!token)return respond(res,401,{message:'관리자 인증이 필요합니다.'});
 let body;try{body=await readBody(req);if(typeof body.secretKey!=='string'||!/^[A-Za-z0-9_-]{12,256}$/.test(body.secretKey))throw Error()}catch{return respond(res,400,{message:'암호화 파일 조회용 Alpaca Secret Key를 입력해 주세요.'})}
 const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json'};
 try{
  const user=await fetchImpl('https://api.github.com/user',{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!user.ok)return respond(res,401,{message:'관리자 토큰을 확인해 주세요.'});
  if((await user.json()).login?.toLowerCase()!=='simhocheol')return respond(res,403,{message:'simhocheol 계정만 조회할 수 있습니다.'});
  const list=await fetchImpl('https://api.github.com/repos/simhocheol/1D1P/actions/artifacts?name=market-data&per_page=10',{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!list.ok)return respond(res,403,{message:'토큰에 Actions: Read 권한을 추가해 주세요.'});
  const artifact=(await list.json()).artifacts?.find(a=>!a.expired);
  if(!artifact)return respond(res,404,{message:'아직 수집된 시세 파일이 없습니다.'});
  const redirect=await fetchImpl(`https://api.github.com/repos/simhocheol/1D1P/actions/artifacts/${artifact.id}/zip`,{headers,redirect:'manual',signal:AbortSignal.timeout(10000)});
  if(redirect.status!==302)throw Error();
  const url=new URL(redirect.headers.get('location'));
  if(url.protocol!=='https:'||!(url.hostname.endsWith('.blob.core.windows.net')||url.hostname.endsWith('.githubusercontent.com')))throw Error();
  const download=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(20000)});
  if(!download.ok||Number(download.headers.get('content-length'))>20000000)throw Error();
  const bytes=new Uint8Array(await download.arrayBuffer());if(bytes.length>20000000)throw Error();
  const zip=unzipSync(bytes,{filter:file=>file.name==='market.enc'&&file.originalSize<20000000});
  if(!zip['market.enc'])throw Error();
  const data=open(strFromU8(zip['market.enc']),body.secretKey);
  return respond(res,200,{checkedAt:data.checkedAt,feed:data.feed,metrics:data.metrics,news:data.news,newsErrors:data.newsErrors,status:data.status});
 }catch{return respond(res,502,{message:'암호화 시세 파일을 불러오지 못했습니다. 수집 당시 Alpaca Secret Key인지 확인해 주세요.'})}finally{body.secretKey=undefined}
};}
export default makeHandler();
