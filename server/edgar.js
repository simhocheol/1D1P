// SEC EDGAR filings → Driver evidence. 8-K item codes carry the event type, not its direction.
export const itemDrivers={
 '1.01':{drivers:['revenue'],label:'중요 계약 체결'},
 '1.02':{drivers:['revenue'],label:'중요 계약 해지'},
 '2.01':{drivers:['capital'],label:'인수·처분 완료'},
 '2.02':{drivers:['revenue','margin'],label:'실적 발표'},
 '2.03':{drivers:['capital','credit'],label:'직접 금융 채무 발생'},
 '2.05':{drivers:['margin'],label:'구조조정·사업 철수 비용'},
 '2.06':{drivers:['margin'],label:'중요 자산 손상'},
 '3.02':{drivers:['capital'],label:'미등록 주식 발행'},
 '5.02':{drivers:['capital'],label:'경영진·이사 변경'},
};
export const formDrivers=[[/^S-3/,['capital'],'증권 발행 등록'],[/^424B[45]$/,['capital'],'증권 발행 설명서(공모)'],[/^SC 13D/,['capital'],'5% 이상 지분 보고']];
const etParts=t=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(t).map(p=>[p.type,p.value]));
// EDGAR acceptanceDateTime is Eastern wall time even though it ends in "Z".
export function edgarTime(v){
 const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(v||'');if(!m)return null;
 const [y,mo,d,h,mi,s]=m.slice(1).map(Number);let t=Date.UTC(y,mo-1,d,h,mi,s);
 for(let i=0;i<2;i++){const p=etParts(new Date(t));t+=Date.UTC(y,mo-1,d,h,mi,s)-Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)}
 return new Date(t).toISOString();
}
// One filing → evidence rows per Driver.
export function filingEvidence(f){
 const rows=[];
 if(/^8-K/.test(f.form))for(const item of f.items||[]){const m=itemDrivers[item];if(m)for(const driver of m.drivers)rows.push({driver,item,label:m.label})}
 for(const [re,drivers,label] of formDrivers)if(re.test(f.form))for(const driver of drivers)rows.push({driver,item:null,label});
 return rows.map(r=>({...r,symbol:f.symbol,form:f.form,title:`${f.symbol} ${f.form}${r.item?` Item ${r.item}`:''} · ${r.label}`,url:f.url,source:'SEC EDGAR',publishedAt:f.acceptedAt,kind:'filing'}));
}
