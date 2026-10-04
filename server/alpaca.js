export const alpacaConfig={provider:'alpaca',feed:'iex',timeframe:'1Day',mode:'market-data-read-only'};
export function validCredentials(key,secret){return [key,secret].every(v=>typeof v==='string'&&/^[A-Za-z0-9_-]{12,256}$/.test(v));}
export async function verifyAlpaca(key,secret,{fetchImpl=fetch,now=Date.now()}={}){
 const url=new URL('https://data.alpaca.markets/v2/stocks/bars');
 const end=new Date(now-20*60*1000),start=new Date(now-14*24*60*60*1000);
 url.search=new URLSearchParams({symbols:'AAPL',timeframe:'1Day',start:start.toISOString(),end:end.toISOString(),limit:'1',feed:'iex',adjustment:'raw',sort:'desc'}).toString();
 let response;try{response=await fetchImpl(url.toString(),{headers:{'APCA-API-KEY-ID':key,'APCA-API-SECRET-KEY':secret},signal:AbortSignal.timeout(12000)})}catch{return {ok:false,status:502,message:'Alpaca 서버에 연결하지 못했습니다.'}}
 if(!response.ok){const messages={401:'API Key와 Secret Key가 유효한 쌍인지 확인해 주세요.',403:'IEX 시장 데이터 접근 권한을 확인해 주세요.',429:'Alpaca 요청 한도를 초과했습니다. 잠시 후 다시 확인해 주세요.'};return {ok:false,status:[401,403,429].includes(response.status)?response.status:502,message:messages[response.status]||'Alpaca 연결 확인에 실패했습니다.'}}
 try{const data=await response.json();if(!data.bars||typeof data.bars!=='object'||Array.isArray(data.bars))throw Error();const bars=data.bars.AAPL??[];if(!Array.isArray(bars)||bars.some(b=>!Number.isFinite(Date.parse(b.t))||!['o','h','l','c','v'].every(k=>typeof b[k]==='number'&&Number.isFinite(b[k]))))throw Error();return {ok:true,status:200,hasData:bars.length>0,...alpacaConfig,message:bars.length?'IEX 일봉 접근 확인. 키는 저장하지 않았으며 주문 기능은 사용하지 않습니다.':'인증·조회 응답 확인. 해당 구간의 일봉은 없으며 시세 수집 완료를 의미하지 않습니다.'}}catch{return {ok:false,status:502,message:'Alpaca 일봉 응답을 확인하지 못했습니다.'}}
}
