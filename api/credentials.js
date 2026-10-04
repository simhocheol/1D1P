import sodium from 'libsodium-wrappers';
import {respond,allowedOrigin,readBody} from '../server/request.js';
import {validCredentials} from '../server/alpaca.js';
const repo='/repos/simhocheol/1D1P/actions/secrets';
const names=['OPENAI_API_KEY','ALPACA_CREDENTIALS_JSON','ALPACA_API_KEY','ALPACA_SECRET_KEY'];
class StoreError extends Error{constructor(status,message){super(message);this.status=status}}
export function makeHandler({fetchImpl=fetch,env=process.env}={}){return async(req,res)=>{
 if(req.method!=='POST'){res.setHeader('Allow','POST');return respond(res,405,{message:'POST 요청만 지원합니다.'})}
 if(!allowedOrigin(req.headers.origin,env))return respond(res,403,{message:'허용된 설정 화면에서 요청해 주세요.'});
 if(!req.headers['content-type']?.startsWith('application/json'))return respond(res,415,{message:'JSON 요청이 필요합니다.'});
 const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_]{20,300})$/)?.[1];
 if(!token)return respond(res,401,{message:'저장소 관리자 인증이 필요합니다.'});
 let body;try{body=await readBody(req)}catch{return respond(res,400,{message:'요청 형식 또는 크기를 확인해 주세요.'})}
 if(!['status','save'].includes(body?.action))return respond(res,400,{message:'지원하지 않는 요청입니다.'});
 let secretName,value;
 if(body.action==='save'){
  if(body.provider==='openai'&&typeof body.apiKey==='string'&&/^sk-[A-Za-z0-9_-]{16,500}$/.test(body.apiKey)){secretName='OPENAI_API_KEY';value=body.apiKey}
  else if(body.provider==='alpaca'&&validCredentials(body.apiKey,body.secretKey)){secretName='ALPACA_CREDENTIALS_JSON';value=JSON.stringify({apiKey:body.apiKey,secretKey:body.secretKey})}
  else return respond(res,400,{message:'저장할 제공처와 키 형식을 확인해 주세요.'});
 }
 async function github(path,options={}){let response;try{response=await fetchImpl(`https://api.github.com${path}`,{...options,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(options.body?{'Content-Type':'application/json'}:{})},redirect:'error',signal:AbortSignal.timeout(12000)})}catch{throw new StoreError(502,'암호화 저장소에 연결하지 못했습니다.')}
  if(!response.ok&&response.status!==404){const status=[401,403,429].includes(response.status)?response.status:502;throw new StoreError(status,response.status===401?'GitHub 관리자 토큰이 만료되었거나 유효하지 않습니다.':response.status===403?'1D1P 저장소의 Secrets 읽기·쓰기 권한을 확인해 주세요.':'암호화 저장소 요청에 실패했습니다.')}
  return response;
 }
 try{
  const userResponse=await github('/user');if(userResponse.status===404)throw new StoreError(401,'관리자 인증에 실패했습니다.');const user=await userResponse.json();
  if(user.login?.toLowerCase()!=='simhocheol')return respond(res,403,{message:'simhocheol 계정만 키를 관리할 수 있습니다.'});
  if(body.action==='status'){
   const metadata={};for(const name of names){const response=await github(`${repo}/${name}`);if(response.status===404)metadata[name]=null;else{const item=await response.json();metadata[name]={updatedAt:item.updated_at}}}
   const bundle=metadata.ALPACA_CREDENTIALS_JSON,legacy=metadata.ALPACA_API_KEY&&metadata.ALPACA_SECRET_KEY;
   return respond(res,200,{owner:'simhocheol',store:'github_actions_secrets',saved:{openai:{configured:!!metadata.OPENAI_API_KEY,updatedAt:metadata.OPENAI_API_KEY?.updatedAt??null},alpaca:{configured:!!(bundle||legacy),updatedAt:bundle?.updatedAt??metadata.ALPACA_SECRET_KEY?.updatedAt??null,format:bundle?'bundle':legacy?'legacy_pair':null}}});
  }
  const publicResponse=await github(`${repo}/public-key`);if(publicResponse.status===404)throw new StoreError(403,'1D1P 저장소의 Secrets 권한을 확인해 주세요.');const publicKey=await publicResponse.json();
  await sodium.ready;const bytes=sodium.from_string(value);let encrypted;
  try{const key=sodium.from_base64(publicKey.key,sodium.base64_variants.ORIGINAL);if(key.length!==sodium.crypto_box_PUBLICKEYBYTES||typeof publicKey.key_id!=='string')throw Error();encrypted=sodium.to_base64(sodium.crypto_box_seal(bytes,key),sodium.base64_variants.ORIGINAL)}catch{throw new StoreError(502,'저장소 암호화 공개키를 확인하지 못했습니다.')}
  finally{sodium.memzero(bytes);value=undefined;body.apiKey=undefined;body.secretKey=undefined}
  const writeResponse=await github(`${repo}/${secretName}`,{method:'PUT',body:JSON.stringify({encrypted_value:encrypted,key_id:publicKey.key_id})});
  if(![201,204].includes(writeResponse.status))throw new StoreError(502,'암호화 저장 완료를 확인하지 못했습니다.');
  return respond(res,200,{persisted:true,provider:body.provider,store:'github_actions_secrets',updatedAt:new Date().toISOString(),message:'암호화 저장 완료. 새로고침·재배포 후에도 유지되며, 저장한 키의 원문은 다시 표시하지 않습니다.'});
 }catch(error){return respond(res,error instanceof StoreError?error.status:502,{message:error instanceof StoreError?error.message:'암호화 저장 요청을 처리하지 못했습니다.'})}
 finally{value=undefined;body.apiKey=undefined;body.secretKey=undefined}
};}
export default makeHandler();
