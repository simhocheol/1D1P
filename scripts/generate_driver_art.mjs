// Generate Driver thumbnails with the OpenAI Images API → public/drivers/{id}.webp
import fs from 'node:fs/promises';
import {drivers} from '../src/framework.js';
const key=process.env.OPENAI_API_KEY,model=process.env.IMAGE_MODEL||'gpt-image-2.5';
const only=(process.env.DRIVER_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);
if(!key){console.error('OPENAI_API_KEY 미등록');process.exit(1)}
const auth={Authorization:`Bearer ${key}`};
const models=await fetch('https://api.openai.com/v1/models',{headers:auth,signal:AbortSignal.timeout(20000)});
if(!models.ok){console.error(`모델 목록 조회 실패 HTTP ${models.status}`);process.exit(1)}
const ids=(await models.json()).data.map(m=>m.id);
if(!ids.includes(model)){console.error(`${model} 사용 불가. 사용 가능한 이미지 모델: ${ids.filter(i=>/image|dall-e/.test(i)).join(', ')||'없음'}`);process.exit(1)}
const palette={macro:'saturated teal (#14B8A6) background',industry:'saturated magenta-pink (#EC4899) background',company:'saturated amber-orange (#F59E0B) background'};
const subject={
 demand:'a shopping cart overflowing with parcels and a small storefront awning',
 cost:'a long paper receipt curling up beside a rising price tag and stacked coins',
 rates:'a giant percent sign sculpture balanced on a stack of government bond certificates',
 credit:'a classical bank building with a large credit card leaning against it',
 liquidity:'a water tower pouring a stream of coins into a pool',
 fx:'two oversized coins (dollar and euro) linked by circular exchange arrows',
 policy:'a judge gavel resting on a sound block next to a balance scale and a sealed document',
 supply:'a small factory with a conveyor belt carrying shipping containers',
 investment:'a large microchip with a robotic arm and a server rack',
 revenue:'a cash register with a rising bar chart and order slips',
 margin:'an open wallet and a piggy bank with coins and a shrinking/expanding gap meter',
 capital:'a leather briefcase with stock certificates and a handshake emblem',
};
const style='Isometric flat vector illustration, bold clean black outlines, cel-shaded with two tones per surface, limited palette of navy blue, lime-yellow (#D4F25A) accents and black, small motion lines and sparkles around the object, centered single object with soft drop shadow, generous empty margin, no text, no letters, no numbers, no logos, playful editorial style like a modern fintech blog hero illustration.';
await fs.mkdir(new URL('../public/drivers/',import.meta.url),{recursive:true});
let failed=0;
for(const d of drivers.filter(d=>!only.length||only.includes(d.id))){
 const prompt=`${style} Subject: ${subject[d.id]}, representing the economic concept "${d.definition}". Background: solid ${palette[d.layer]}.`;
 try{
  const r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({model,prompt,size:'1536x1024',quality:'medium',output_format:'webp',n:1}),signal:AbortSignal.timeout(180000)});
  const body=await r.json();
  if(!r.ok||!body.data?.[0]?.b64_json)throw Error(`HTTP ${r.status} ${body.error?.message||''}`);
  await fs.writeFile(new URL(`../public/drivers/${d.id}.webp`,import.meta.url),Buffer.from(body.data[0].b64_json,'base64'));
  console.log(`generated ${d.id}`);
 }catch(e){failed++;console.error(`failed ${d.id}: ${e.message}`)}
}
process.exit(failed?1:0);
