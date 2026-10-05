import indicators from 'technicalindicators';
const etDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'});
export function summarize(bars){
 const sorted=[...bars].sort((a,b)=>Date.parse(a.t)-Date.parse(b.t));
 if(!sorted.length)return null;
 const last=sorted.at(-1),previous=sorted.at(-2),values=sorted.map(b=>b.c);
 const mean=n=>values.length>=n?indicators.SMA.calculate({period:n,values}).at(-1):null;
 const volumes=sorted.slice(-21,-1).map(b=>b.v);
 const avg=volumes.length===20?volumes.reduce((a,b)=>a+b,0)/20:null;
 return {date:etDate.format(new Date(last.t)),close:last.c,volume:last.v,change:previous?.c>0?(last.c/previous.c-1)*100:null,sma20:mean(20),sma50:mean(50),rsi14:values.length>=15?indicators.RSI.calculate({period:14,values}).at(-1):null,volumeRatio:avg>0?last.v/avg:null,bars:sorted.length};
}
export function association(asset,proxy){
 const returns=rows=>new Map(rows.slice(1).map((b,i)=>[b.t,rows[i].c>0?b.c/rows[i].c-1:NaN]));
 const a=returns(asset),p=returns(proxy),pairs=[...a].filter(([t,v])=>Number.isFinite(v)&&Number.isFinite(p.get(t))).map(([t,v])=>[v,p.get(t)]).slice(-60);
 if(pairs.length<30)return null;
 const n=pairs.length,x=pairs.reduce((s,v)=>s+v[1],0)/n,y=pairs.reduce((s,v)=>s+v[0],0)/n;
 const vx=pairs.reduce((s,v)=>s+(v[1]-x)**2,0),vy=pairs.reduce((s,v)=>s+(v[0]-y)**2,0),cov=pairs.reduce((s,v)=>s+(v[1]-x)*(v[0]-y),0);
 return vx>0&&vy>0?{beta:cov/vx,correlation:cov/Math.sqrt(vx*vy),samples:n}:null;
}
