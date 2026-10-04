function respond(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(body));}
function allowedOrigin(origin,env){const trusted=[env.APP_ORIGIN||'https://1d1phocheol.vercel.app',env.VERCEL_URL&&`https://${env.VERCEL_URL}`].filter(Boolean);if(trusted.includes(origin))return true;if(env.NODE_ENV==='production')return false;try{const u=new URL(origin);return u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)}catch{return false}}
async function readBody(req){if(Number(req.headers['content-length'])>4096)throw Error('too-large');if(req.body!==undefined){const body=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(body)>4096)throw Error('too-large');return JSON.parse(body)}let raw='';for await(const chunk of req){raw+=chunk.toString();if(Buffer.byteLength(raw)>4096)throw Error('too-large')}return JSON.parse(raw)}
export function makeHandler({fetchImpl=fetch,env=process.env}={}){return async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return respond(res,405,{message:'연결 테스트는 POST 요청만 지원합니다.'})}
 if(!allowedOrigin(req.headers.origin,env))return respond(res,403,{message:'허용된 설정 화면에서 요청해 주세요.'});
 if(!req.headers['content-type']?.startsWith('application/json'))return respond(res,415,{message:'JSON 요청이 필요합니다.'});
 let key;try{const body=await readBody(req);key=body?.apiKey;if(typeof key!=='string'||!/^sk-[A-Za-z0-9_-]{16,500}$/.test(key))return respond(res,400,{message:'OpenAI API 키 형식을 확인해 주세요.'})}catch{return respond(res,400,{message:'요청 형식 또는 크기를 확인해 주세요.'})}
 try{
  const response=await fetchImpl('https://api.openai.com/v1/models',{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(12000)});
  if(!response.ok){const messages={401:'키가 유효하지 않거나 만료되었습니다.',403:'이 키에 모델 목록 조회 권한이 없습니다. 제한된 키의 권한을 확인해 주세요.',429:'요청 제한이 발생했습니다. 잠시 후 다시 확인해 주세요.'};return respond(res,response.status===401?401:response.status===403?403:response.status===429?429:502,{message:messages[response.status]||'OpenAI 연결 확인에 실패했습니다.'})}
  const data=await response.json();if(!Array.isArray(data.data))return respond(res,502,{message:'OpenAI 응답을 확인하지 못했습니다.'});
  return respond(res,200,{verified:true,persisted:false,message:'모델 목록 조회 성공. 키는 저장하지 않았습니다. 생성 권한·결제 상태·자동 발행은 별도 확인이 필요합니다.'});
 }catch{return respond(res,502,{message:'OpenAI 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'})}
 finally{key=undefined}
};}
export default makeHandler();
