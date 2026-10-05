const ET='America/New_York';
const parts=t=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:ET,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(t).map(p=>[p.type,p.value]));
// UTC instant for an ET wall-clock time (handles DST).
export function etInstant(y,m,d,h,mi){let t=Date.UTC(y,m-1,d,h,mi);for(let i=0;i<2;i++){const p=parts(new Date(t));t+=Date.UTC(y,m-1,d,h,mi)-Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute)}return new Date(t)}
// Scheduled slot occurrences on weekdays (ET), previous and next around now.
export function slotWindow(now,hour,minute){
 const p=parts(now);let y=+p.year,m=+p.month,d=+p.day;
 const at=(off)=>{const base=new Date(Date.UTC(y,m-1,d+off));return {date:base,inst:etInstant(base.getUTCFullYear(),base.getUTCMonth()+1,base.getUTCDate(),hour,minute),wd:base.getUTCDay()}};
 let next=null,prev=null;
 for(let off=0;off<8&&!next;off++){const o=at(off);if(o.wd>0&&o.wd<6&&o.inst>now)next=o.inst}
 for(let off=0;off>-8&&!prev;off--){const o=at(off);if(o.wd>0&&o.wd<6&&o.inst<=now)prev=o.inst}
 return {prev,next};
}
