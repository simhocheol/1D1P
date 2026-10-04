import {respond,allowedOrigin,readBody} from '../server/request.js';
import {validCredentials,verifyAlpaca} from '../server/alpaca.js';
export function makeHandler({fetchImpl=fetch,env=process.env}={}){return async(req,res)=>{
 if(req.method!=='POST'){res.setHeader('Allow','POST');return respond(res,405,{message:'POST 요청만 지원합니다.'})}
 if(!allowedOrigin(req.headers.origin,env))return respond(res,403,{message:'허용된 설정 화면에서 요청해 주세요.'});
 if(!req.headers['content-type']?.startsWith('application/json'))return respond(res,415,{message:'JSON 요청이 필요합니다.'});
 let key,secret;try{const body=await readBody(req);key=body?.apiKey;secret=body?.secretKey;if(!validCredentials(key,secret))return respond(res,400,{message:'API Key와 Secret Key를 모두 확인해 주세요.'})}catch{return respond(res,400,{message:'요청 형식 또는 크기를 확인해 주세요.'})}
 try{const result=await verifyAlpaca(key,secret,{fetchImpl});const {status,ok,...details}=result;return respond(res,status,{verified:ok,persisted:false,...details})}finally{key=undefined;secret=undefined}
};}
export default makeHandler();
