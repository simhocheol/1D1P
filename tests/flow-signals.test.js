import test from 'node:test';
import assert from 'node:assert/strict';
import {etfFlow,flowStage,breadth,breadthStage,liquidity,cotPosition,cotText,attentionRatio,attentionStage,newsAttention} from '../server/flow-signals.js';
test('ETF creations: shares change times NAV over fund assets', ()=>{
 const rows=[['Fund Name:','X'],['Date','NAV','Shares Outstanding','Total Net Assets']];
 for(let i=0;i<30;i++){const d=new Date(Date.UTC(2026,8,30-i));rows.push([`${String(d.getUTCDate()).padStart(2,'0')}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]}-2026`,'100',String(1000-i*10)])}
 const f=etfFlow(rows);assert.ok(f.pct5>4);assert.equal(flowStage(f.pct5),'strong_in');assert.equal(etfFlow([['x']]),null);
});
test('breadth and liquidity stages', ()=>{
 const closes={};for(let i=0;i<120;i++)closes['S'+i]=Array.from({length:60},(_,k)=>100+k+(i<90?1:-60*(k===59)));
 const b=breadth(closes,()=> 'Financials');assert.ok(b.up>=70);assert.equal(breadthStage(b.up),'wide');
 const wk=(n,f)=>Array.from({length:n},(_,i)=>({d:`2026-0${1+Math.floor(i/28)}-${String(1+i%28).padStart(2,'0')}`,v:f(i)}));
 const l=liquidity({walcl:wk(10,i=>7000000+i*50000),rrp:wk(10,()=>100),tga:wk(10,()=>700000),mmf:wk(10,i=>6000*(1+i*0.01))});
 assert.equal(l.netDir,'up');assert.equal(l.mmfDir,'up');
});
test('COT percentile, attention and news attention', ()=>{
 const rows=Array.from({length:40},(_,i)=>({report_date_as_yyyy_mm_dd:`2026-${String(1+Math.floor(i/4)).padStart(2,'0')}-${String(1+(i%4)*7).padStart(2,'0')}T00:00:00.000`,open_interest_all:'1000',noncomm_positions_long_all:String(500+i*10),noncomm_positions_short_all:'400'}));
 const p=cotPosition(rows);assert.equal(p.side,'long');assert.ok(p.percentile>=95);assert.ok(cotText(p).includes('최고 수준'));
 assert.equal(attentionStage(attentionRatio([...Array(28).fill(100),400])),'surge');
 const now=Date.parse('2026-10-09T12:00:00Z'),n=[...Array(14).fill({at:'2026-10-05T00:00:00Z',symbols:['JPM']}),...Array(9).fill({at:'2026-10-09T06:00:00Z',symbols:['JPM']})];
 assert.equal(newsAttention(n,s=>s==='JPM'?'Financials':null,now).Financials,'surge');
});
