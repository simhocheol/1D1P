// Money and attention signals: real ETF flows, market breadth, liquidity, large-trader positioning,
// news and Wikipedia attention. Public output is stages and short labels only.
import {unzipSync,strFromU8} from 'fflate';
const median=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:null};
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
// Minimal xlsx reader for the first worksheet (shared strings + numbers).
export function xlsxRows(buf){
 const z=unzipSync(new Uint8Array(buf));const ss=z['xl/sharedStrings.xml']?strFromU8(z['xl/sharedStrings.xml']):'';
 const strs=[...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m=>[...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map(x=>x[1]).join(''));
 return [...strFromU8(z['xl/worksheets/sheet1.xml']).matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)].map(r=>[...r[1].matchAll(/<c r="[A-Z]+\d+"([^>]*?)(?:\/>|>(?:<f>[^<]*<\/f>)?(?:<v>([^<]*)<\/v>)?<\/c>)/g)].map(c=>/t="s"/.test(c[1])?strs[+c[2]]:c[2]));
}
const MON={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
// SPDR NAV history rows → daily creations/redemptions in dollars (Δshares × NAV), newest first.
export function etfFlow(rows){
 const h=rows.findIndex(r=>r[0]==='Date'&&r.includes('Shares Outstanding'));if(h<0)return null;
 const iN=rows[h].indexOf('NAV'),iS=rows[h].indexOf('Shares Outstanding');
 const d=rows.slice(h+1).map(r=>{const m=/^(\d{2})-(\w{3})-(\d{4})$/.exec(r[0]||'');return m?{d:`${m[3]}-${String(MON[m[2]]).padStart(2,'0')}-${m[1]}`,nav:+r[iN],sh:+r[iS]}:null}).filter(x=>x&&x.nav>0&&x.sh>0).sort((a,b)=>b.d.localeCompare(a.d));
 if(d.length<25)return null;
 const flows=d.slice(0,-1).map((x,i)=>({d:x.d,usd:(x.sh-d[i+1].sh)*x.nav}));const aum=d[0].nav*d[0].sh;
 const pct=n=>flows.slice(0,n).reduce((s,f)=>s+f.usd,0)/aum*100;
 return {asOf:d[0].d,pct5:pct(5),pct20:pct(20)};
}
export const flowStage=p=>p==null?null:p>=1?'strong_in':p>=0.2?'in':p<=-1?'strong_out':p<=-0.2?'out':'flat';
export const flowStageText={strong_in:'큰 유입',in:'유입',flat:'변화 작음',out:'유출',strong_out:'큰 유출'};
// Breadth from daily closes per symbol (oldest first): share rising on the last day, share above the 50-day average.
export function breadth(closes,sectorOf){
 const rows=Object.entries(closes).filter(([,c])=>c.length>=51).map(([s,c])=>({s,sector:sectorOf(s),up:c.at(-1)>c.at(-2),above:c.at(-1)>mean(c.slice(-50))}));
 if(rows.length<100)return null;
 const pct=(a,k)=>Math.round(a.filter(r=>r[k]).length/a.length*100);
 const by={};for(const r of rows)(by[r.sector]||=[]).push(r);
 return {count:rows.length,up:pct(rows,'up'),above50:pct(rows,'above'),sectors:Object.fromEntries(Object.entries(by).map(([k,v])=>[k,{up:pct(v,'up'),above50:pct(v,'above')}]))};
}
export const breadthStage=p=>p==null?null:p>=70?'wide':p>=55?'healthy':p>=45?'mixed':p>=30?'narrow':'weak';
export const breadthText={wide:'넓게 상승',healthy:'고르게 양호',mixed:'엇갈림',narrow:'좁음(소수만 상승)',weak:'약세 확산'};
// Net liquidity (Fed balance sheet − reverse repo − Treasury account) and retail money-fund cash, 4-week direction.
export function liquidity({walcl,rrp,tga,mmf}){
 if(!walcl?.length||!rrp?.length||!tga?.length)return null;
 const pick=(a,d)=>[...a].reverse().find(o=>o.d<=d)?.v;
 const last=walcl.at(-1).d,prev=walcl.at(-5)?.d;if(!prev)return null;
 const net=d=>{const w=pick(walcl,d),r=pick(rrp,d),t=pick(tga,d);return w==null||r==null||t==null?null:w/1000-r-t/1000}; // billions of dollars
 const n1=net(last),n0=net(prev);const chg=n1!=null&&n0!=null?n1-n0:null;
 const m=(mmf||[]).slice(-30);const mchg=m.length>=5?(m.at(-1).v/m.at(-5).v-1)*100:null;
 return {asOf:last,netDir:chg==null?null:chg>50?'up':chg<-50?'down':'flat',mmfDir:mchg==null?null:mchg>1?'up':mchg<-1?'down':'flat'};
}
export const liquidityText={up:'늘어나는 중',down:'줄어드는 중',flat:'큰 변화 없음'};
// CFTC legacy report: non-commercial (speculative) net position as a share of open interest; 3-year percentile.
export function cotPosition(rows){
 const d=rows.map(r=>({d:String(r.report_date_as_yyyy_mm_dd).slice(0,10),net:(+r.noncomm_positions_long_all)-(+r.noncomm_positions_short_all),oi:+r.open_interest_all})).filter(x=>x.oi>0).sort((a,b)=>a.d.localeCompare(b.d));
 if(d.length<20)return null;const share=d.map(x=>x.net/x.oi),cur=share.at(-1),hist=share.slice(-156);
 const delta=share.at(-1)-share.at(-2);
 return {asOf:d.at(-1).d,side:cur>0.02?'long':cur<-0.02?'short':'neutral',percentile:Math.round(hist.filter(v=>v<=cur).length/hist.length*100),change:delta>0.01?'up':delta<-0.01?'down':'flat'};
}
export const cotText=p=>!p?null:`${p.side==='long'?'순매수':p.side==='short'?'순매도':'중립'} · 3년 중 ${p.percentile>=80?'최고 수준':p.percentile<=20?'최저 수준':'보통 수준'} · 지난주 대비 ${p.change==='up'?'매수 늘림':p.change==='down'?'매수 줄임':'비슷'}`;
// Attention: latest day versus the median of the prior 28 days.
export function attentionRatio(daily){if(daily.length<15)return null;const base=median(daily.slice(-29,-1));return base>0?daily.at(-1)/base:null}
export const attentionStage=r=>r==null?null:r>=3?'surge':r>=1.5?'up':r<=0.6?'down':'normal';
export const attentionText={surge:'관심 급증',up:'관심 증가',normal:'평소 수준',down:'관심 감소'};
// News attention by sector: last 24 hours versus the daily average of the previous 7 days.
export function newsAttention(news,sectorOf,now=Date.now()){
 const day=864e5,cut=now-day,start=now-8*day;const cur={},prev={};
 for(const n of news){const t=Date.parse(n.at);if(!(t>=start))continue;const secs=new Set((n.symbols||[]).map(sectorOf).filter(Boolean));for(const s of secs){if(t>=cut)cur[s]=(cur[s]||0)+1;else prev[s]=(prev[s]||0)+1}}
 return Object.fromEntries([...new Set([...Object.keys(cur),...Object.keys(prev)])].map(s=>{const base=(prev[s]||0)/7;return [s,attentionStage(base>0?(cur[s]||0)/base:null)]}));
}
