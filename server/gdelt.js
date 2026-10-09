// GDELT DOC API: public headlines and original links from established economic outlets, used as
// "related news" under each briefing. Only title, outlet domain, URL and time are kept.
export const outlets=['reuters.com','cnbc.com','marketwatch.com','apnews.com','finance.yahoo.com','fortune.com','barrons.com','investing.com'];
const terms={stocks:'stocks',rates:'treasury',fear:'volatility',crypto:'bitcoin',oil:'oil',natgas:'"natural gas"',gold:'gold',silver:'silver',copper:'copper',grains:'wheat'};
export function gdeltQuery(ids){
 const t=[...new Set((ids.length?ids:['stocks','rates']).map(id=>terms[id]).filter(Boolean))].slice(0,6);
 return `(${t.join(' OR ')}) (${outlets.map(d=>`domainis:${d}`).join(' OR ')}) sourcelang:english`;
}
export function parseArticles(json){
 const seen=new Set();
 return (json?.articles||[]).map(a=>{let url;try{url=new URL(a.url)}catch{return null}if(url.protocol!=='https:'||!outlets.some(d=>url.hostname===d||url.hostname.endsWith(`.${d}`)))return null;
  const title=String(a.title||'').replace(/\s+/g,' ').trim();if(!title||seen.has(title.toLowerCase()))return null;seen.add(title.toLowerCase());
  const s=String(a.seendate||'');const at=/^\d{8}T\d{6}Z$/.test(s)?`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}Z`:null;
  return {title:title.slice(0,200),domain:url.hostname.replace(/^www\./,''),url:url.href,at}}).filter(Boolean);
}
