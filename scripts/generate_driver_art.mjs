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
const palette={
 macro:'solid teal background (#14B8A6); the object uses only analogous teal and cyan tones: deep teal #115E59 for outlines and shadows, mid teal #0D9488, light aqua #5EEAD4 and pale mint #CCFBF1 highlights',
 industry:'solid magenta-pink background (#EC4899); the object uses only analogous pink and rose tones: deep plum #831843 for outlines and shadows, raspberry #BE185D, light pink #F9A8D4 and blush #FCE7F3 highlights',
 company:'solid amber-orange background (#F59E0B); the object uses only analogous amber and orange tones: deep brown #78350F for outlines and shadows, burnt orange #C2410C, light gold #FCD34D and cream #FEF3C7 highlights',
};
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
const style='3D rendered app icon illustration. Rendering and texture reference: soft glossy plastic and matte clay materials with smooth rounded bevels, subtle fine ribbed or corrugated surface texture on flat faces, gentle studio lighting with soft gradients and specular highlights, soft ambient occlusion and a faint contact shadow, no outlines at all (edges defined only by light and shading). Keep the composition compact: one object group centered, filling about 70% of a square canvas, viewed from a three-quarter isometric angle. Transparent background. No text, no letters, no numbers, no logos.';
await fs.mkdir(new URL('../public/drivers/',import.meta.url),{recursive:true});
let failed=0;
for(const d of drivers.filter(d=>!only.length||only.includes(d.id))){
 const prompt=`${style} Subject: ${subject[d.id]}, representing the economic concept "${d.definition}". Colors: ${palette[d.layer].replace(/^solid [^;]*; /,'')}; the icon will sit on a ${d.layer==='macro'?'teal':d.layer==='industry'?'pink':'amber'} tile, so use tones harmonized with that tile and avoid using the exact tile color for large surfaces.`;
 try{
  const r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({model,prompt,size:'1024x1024',quality:'medium',background:'transparent',output_format:'webp',n:1}),signal:AbortSignal.timeout(180000)});
  const body=await r.json();
  if(!r.ok||!body.data?.[0]?.b64_json)throw Error(`HTTP ${r.status} ${body.error?.message||''}`);
  await fs.writeFile(new URL(`../public/drivers/${d.id}.webp`,import.meta.url),Buffer.from(body.data[0].b64_json,'base64'));
  console.log(`generated ${d.id}`);
 }catch(e){failed++;console.error(`failed ${d.id}: ${e.message}`)}
}
process.exit(failed?1:0);
