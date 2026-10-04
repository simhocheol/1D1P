const database='1d1p-device-vault';
let queue=Promise.resolve();
const listeners=new Set();
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('1d1p-vault-events'):null;
if(channel)channel.onmessage=event=>{if(['change','clear'].includes(event.data))for(const listener of listeners)listener(event.data)};
function notify(kind){for(const listener of listeners)listener(kind);channel?.postMessage(kind)}
export function subscribeDeviceVault(listener){listeners.add(listener);return()=>listeners.delete(listener)}
function request(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function open(){
 const req=indexedDB.open(database,1);req.onupgradeneeded=()=>req.result.createObjectStore('vault');
 return request(req);
}
async function read(db,name){return request(db.transaction('vault').objectStore('vault').get(name))}
async function write(db,entries){
 const tx=db.transaction('vault','readwrite');for(const [name,value] of entries)tx.objectStore('vault').put(value,name);
 await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});
}
async function load(db){
 const [key,record]=await Promise.all([read(db,'key'),read(db,'data')]);
 if(!record)return {key,data:{}};
 if(!key)throw Error('기기 저장소를 복호화하지 못했습니다. 연결을 초기화해 주세요.');
 const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv},key,record.bytes);
 return {key,data:JSON.parse(new TextDecoder().decode(bytes))};
}
export function readDeviceVault(){const task=queue.then(async()=>{const db=await open();try{return (await load(db)).data}finally{db.close()}});queue=task.catch(()=>{});return task}
export function updateDeviceVault(update){
 const task=queue.then(async()=>{const db=await open();try{
  const current=await load(db),key=current.key||await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  const data=update(current.data),iv=crypto.getRandomValues(new Uint8Array(12));
  const bytes=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(data)));
  await write(db,[['key',key],['data',{iv,bytes}]]);notify('change');return data;
 }finally{db.close()}});queue=task.catch(()=>{});return task;
}
export function clearDeviceVault(){const task=queue.then(async()=>{const db=await open();try{const tx=db.transaction('vault','readwrite');tx.objectStore('vault').clear();await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});notify('clear')}finally{db.close()}});queue=task.catch(()=>{});return task}
