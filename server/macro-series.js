// FRED series per Driver. kind: 'diff' = level change (rates, spreads, index points), 'pct' = percent change.
export const macroSeries=[
 {id:'DGS10',driver:'rates',label:'미국 10년물 금리',unit:'%',kind:'diff',freq:'daily'},
 {id:'DGS2',driver:'rates',label:'미국 2년물 금리',unit:'%',kind:'diff',freq:'daily'},
 {id:'DFII10',driver:'rates',label:'10년 실질금리',unit:'%',kind:'diff',freq:'daily'},
 {id:'T5YIE',driver:'cost',label:'5년 기대인플레이션',unit:'%',kind:'diff',freq:'daily'},
 {id:'DCOILWTICO',driver:'cost',label:'WTI 유가',unit:'$',kind:'pct',freq:'daily'},
 {id:'CPIAUCSL',driver:'cost',label:'소비자물가지수 CPI',unit:'',kind:'pct',freq:'monthly'},
 {id:'PPIFIS',driver:'cost',label:'생산자물가 최종수요 PPI',unit:'',kind:'pct',freq:'monthly'},
 {id:'ICSA',driver:'demand',label:'신규 실업수당 청구',unit:'건',kind:'pct',freq:'weekly'},
 {id:'PAYEMS',driver:'demand',label:'비농업 고용',unit:'천명',kind:'diff',freq:'monthly'},
 {id:'RSAFS',driver:'demand',label:'소매판매',unit:'백만$',kind:'pct',freq:'monthly'},
 {id:'INDPRO',driver:'demand',label:'산업생산',unit:'',kind:'pct',freq:'monthly'},
 {id:'BAMLH0A0HYM2',driver:'credit',label:'하이일드 스프레드',unit:'%',kind:'diff',freq:'daily'},
 {id:'BAA10Y',driver:'credit',label:'Baa−10년물 스프레드',unit:'%',kind:'diff',freq:'daily'},
 {id:'WALCL',driver:'liquidity',label:'연준 총자산',unit:'백만$',kind:'pct',freq:'weekly'},
 {id:'RRPONTSYD',driver:'liquidity',label:'역레포 잔액',unit:'십억$',kind:'pct',freq:'daily'},
 {id:'WTREGEN',driver:'liquidity',label:'재무부 일반계정 TGA',unit:'십억$',kind:'pct',freq:'weekly'},
 {id:'NFCI',driver:'liquidity',label:'시카고 연준 금융여건지수',unit:'',kind:'diff',freq:'weekly'},
 {id:'DTWEXBGS',driver:'fx',label:'달러 지수(광의)',unit:'',kind:'pct',freq:'daily'},
];
const change=(s,a,b)=>s.kind==='pct'?(a!==0?(b/a-1)*100:null):b-a;
// FRED "2026-10-02 07:51:03-05" → ISO
export const fredTime=v=>{const m=/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})([+-]\d{2})$/.exec(v||'');return m?`${m[1]}T${m[2]}${m[3]}:00`:null};
// Signal for one series as of a report date. Daily series need a same-day move; others count when released in the reaction window.
export function macroSignal(series,data,asOf,inWindow){
 const obs=(data?.observations||[]).filter(o=>o.d<=asOf&&Number.isFinite(o.v));
 if(obs.length<3)return null;
 const last=obs.at(-1),prev=obs.at(-2),delta=change(series,prev.v,last.v);
 const hist=obs.slice(-121,-1).map((o,i,a)=>i?change(series,a[i-1].v,o.v):null).filter(Number.isFinite);
 const mean=hist.reduce((s,v)=>s+v,0)/(hist.length||1),sd=Math.sqrt(hist.reduce((s,v)=>s+(v-mean)**2,0)/(hist.length||1));
 const z=sd>0&&Number.isFinite(delta)?(delta-mean)/sd:null;
 const released=series.freq==='daily'?last.d===asOf:!!(data.lastUpdated&&inWindow(data.lastUpdated));
 const active=released&&(series.freq==='daily'?Math.abs(z??0)>=1.5:true);
 return {...series,date:last.d,value:last.v,previous:prev.v,change:delta,z,released,active,lastUpdated:data.lastUpdated||null,url:`https://fred.stlouisfed.org/series/${series.id}`};
}
