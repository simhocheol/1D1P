import {createCipheriv,createDecipheriv,hkdfSync,randomBytes} from 'node:crypto';
const derive=(secret,salt)=>hkdfSync('sha256',secret,salt,'1d1p-market-v1',32);
export function seal(data,secret){
 const salt=randomBytes(32),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',derive(secret,salt),iv);
 const encrypted=Buffer.concat([cipher.update(JSON.stringify(data),'utf8'),cipher.final()]);
 return JSON.stringify({version:1,salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:encrypted.toString('base64')});
}
export function open(envelope,secret){
 const e=JSON.parse(envelope);if(e.version!==1)throw Error();
 const decipher=createDecipheriv('aes-256-gcm',derive(secret,Buffer.from(e.salt,'base64')),Buffer.from(e.iv,'base64'));
 decipher.setAuthTag(Buffer.from(e.tag,'base64'));
 return JSON.parse(Buffer.concat([decipher.update(Buffer.from(e.data,'base64')),decipher.final()]).toString('utf8'));
}
