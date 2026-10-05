// OpenAI evidence classification: schema, prompt and anti-hallucination validation (pure, testable).
import {drivers} from '../src/framework.js';
export const DRIVER_IDS=drivers.map(d=>d.id);
export const responseSchema={name:'driver_classification',strict:true,schema:{type:'object',additionalProperties:false,required:['items'],properties:{items:{type:'array',items:{type:'object',additionalProperties:false,required:['id','drivers'],properties:{id:{type:'string'},drivers:{type:'array',items:{type:'object',additionalProperties:false,required:['driverId','direction','quote','confidence'],properties:{driverId:{type:'string',enum:DRIVER_IDS},direction:{type:'integer',enum:[-1,0,1]},quote:{type:'string'},confidence:{type:'number'}}}}}}}}}};
export const systemPrompt=`You classify US market news and SEC filings into economic transmission Drivers for a research tool. Drivers:
${drivers.map(d=>`- ${d.id}: ${d.definition} (indicators: ${d.indicators})`).join('\n')}
Rules:
- Only assign a Driver when the text states a concrete fact about it. Do not infer from stock price moves, analyst opinions, previews or speculation.
- direction is the effect on the named company's fundamentals (or on risk assets for macro items): 1 favorable, -1 unfavorable, 0 unclear or mixed.
- quote must be copied verbatim from the input text (max 200 characters) and must contain the stated fact.
- confidence 0..1. Return an empty drivers array when nothing qualifies. Keep the given id.`;
const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
// Keep only Drivers whose quote really appears in the source text.
export function validateClassification(items,result,minConfidence=0.6){
 const byId=new Map(items.map(i=>[i.id,i])),out={};
 for(const r of result?.items||[]){
  const src=byId.get(r.id);if(!src)continue;const text=norm(src.text);
  const ok=(r.drivers||[]).filter(d=>DRIVER_IDS.includes(d.driverId)&&[-1,0,1].includes(d.direction)&&Number(d.confidence)>=minConfidence&&norm(d.quote).length>=8&&text.includes(norm(d.quote)));
  if(ok.length)out[r.id]=ok.map(d=>({driverId:d.driverId,direction:d.direction,quote:d.quote.slice(0,200),confidence:Math.round(d.confidence*100)/100}));
 }
 return out;
}
export const htmlToText=html=>String(html||'').replace(/<(script|style)[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&#8217;|&rsquo;/gi,"'").replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/gi,'"').replace(/&[a-z#0-9]+;/gi,' ').replace(/\s+/g,' ').trim();
