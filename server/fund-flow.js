// Hourly money flow by asset class: last complete hour versus the same hour on prior days.
// Public output: stages only (유입/유출, 거래 급증…, 매수 우위…), never prices or volumes.
export const flowClasses=[
 {id:'stocks',label:'주식',symbols:['SPY','QQQ','IWM']},
 {id:'bonds',label:'채권',symbols:['TLT','IEF','SHY']},
 {id:'commodities',label:'원자재',symbols:['GLD','SLV','USO','CPER','DBA']},
 {id:'dollar',label:'달러',symbols:['UUP']},
 {id:'crypto',label:'가상자산',symbols:['BTCUSDT','ETHUSDT'],crypto:true},
];
export const flowNames={SPY:'S&P 500',QQQ:'나스닥',IWM:'소형주',TLT:'장기채',IEF:'중기채',SHY:'단기채',GLD:'금',SLV:'은',USO:'원유',CPER:'구리',DBA:'농산물',UUP:'달러',BTCUSDT:'비트코인',ETHUSDT:'이더리움'};
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
const sd=a=>{if(a.length<10)return null;const m=mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))};
// bars: [{t:ISO start, o, c, v, tb?}] hourly, oldest first; the last element is the last complete hour.
export function symbolFlow(bars){
 if(!bars?.length||bars.length<30)return null;
 const last=bars.at(-1),hour=new Date(last.t).getUTCHours(),day=last.t.slice(0,10);
 const same=bars.filter(b=>new Date(b.t).getUTCHours()===hour&&b.t.slice(0,10)!==day).slice(-20).map(b=>b.v).filter(v=>v>0);
 const sigma=sd(bars.slice(0,-1).map(b=>b.o>0?(b.c/b.o-1)*100:null).filter(Number.isFinite));
 if(same.length<5||!sigma||!(last.o>0))return null;
 const out={at:last.t,ratio:last.v/mean(same),z:(last.c/last.o-1)*100/sigma};
 if(Number.isFinite(last.tb)&&last.v>last.tb)out.strength=last.tb/(last.v-last.tb)*100; // taker buy / taker sell, %
 return out;
}
export const volStage=r=>r>=2?'surge':r>=1.3?'up':r>=0.7?'normal':'quiet';
export const volText={surge:'거래 급증',up:'거래 증가',normal:'거래 평소',quiet:'거래 한산'};
export const flowText={in:'유입',out:'유출',flat:'정체'};
export function classFlow(cls,stats){
 const rows=cls.symbols.map(s=>stats[s]?{s,...stats[s]}:null).filter(Boolean);
 if(!rows.length)return {id:cls.id,label:cls.label,dir:null};
 const ratio=mean(rows.map(r=>r.ratio)),z=mean(rows.map(r=>r.z));
 const dir=ratio>=0.9&&z>=0.5?'in':ratio>=0.9&&z<=-0.5?'out':'flat';
 const lead=rows.slice().sort((a,b)=>Math.abs(b.z)*b.ratio-Math.abs(a.z)*a.ratio)[0];
 const st=rows.map(r=>r.strength).filter(Number.isFinite);const strength=st.length?mean(st):null;
 return {id:cls.id,label:cls.label,dir,vol:volStage(ratio),lead:dir!=='flat'?flowNames[lead.s]:null,
  pressure:strength==null?null:strength>=110?'buy':strength<=90?'sell':'even'};
}
export const pressureText={buy:'매수 우위',sell:'매도 우위',even:'매수·매도 균형'};
export function flowSummary(flows){return flows.filter(f=>f.dir).map(f=>`${f.label} ${flowText[f.dir]}(${volText[f.vol]}${f.pressure?`, ${pressureText[f.pressure]}`:''}${f.lead?`, ${f.lead} 중심`:''})`).join(', ')}
