import {respond,allowedOrigin,readBody} from '../server/request.js';
import {open} from '../server/market-vault.js';
import {authorize,downloadArtifact} from '../server/github-artifact.js';
// Server-side report archive shared across devices. Body: {secretKey, key?: "YYYY-MM-DD|pre|post"}.
export function makeHandler({fetchImpl=fetch,env=process.env}={}){return async(req,res)=>{
 if(req.method!=='POST')return respond(res,405,{message:'POST 요청만 지원합니다.'});
 if(!allowedOrigin(req.headers.origin,env))return respond(res,403,{message:'허용된 사이트에서 요청해 주세요.'});
 const token=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_]{20,300})$/)?.[1];
 if(!token)return respond(res,401,{message:'관리자 인증이 필요합니다.'});
 let body;try{body=await readBody(req);if(typeof body.secretKey!=='string'||!/^[A-Za-z0-9_-]{12,256}$/.test(body.secretKey))throw Error()}catch{return respond(res,400,{message:'보관 리포트 복호화용 Alpaca Secret Key를 입력해 주세요.'})}
 if(body.key!==undefined&&!/^\d{4}-\d{2}-\d{2}\|(pre|post)$/.test(body.key))return respond(res,400,{message:'리포트 키 형식을 확인해 주세요.'});
 try{
  const auth=await authorize(fetchImpl,token);if(!auth.headers)return respond(res,auth.status,{message:auth.message});
  const file=body.key?`${body.key.replace('|','-')}.enc`:null;
  const got=await downloadArtifact(fetchImpl,auth.headers,'report-archive',n=>n==='index.json'||n===file);
  if(!got.files)return respond(res,got.status,{message:got.message});
  const index=JSON.parse(got.text(got.files['index.json']||new Uint8Array()) || '{"items":[]}');
  if(!file)return respond(res,200,{items:index.items||[]});
  if(!got.files[file])return respond(res,404,{message:'해당 보관 리포트가 없습니다.'});
  const sealed=open(got.text(got.files[file]),body.secretKey);
  return respond(res,200,{report:sealed.report,generatedAt:sealed.generatedAt});
 }catch{return respond(res,502,{message:'보관 리포트를 불러오지 못했습니다. 수집 당시 Alpaca Secret Key인지 확인해 주세요.'})}finally{body.secretKey=undefined}
};}
export default makeHandler();
