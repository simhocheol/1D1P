import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFomc,latestResult,releases} from '../server/econ-calendar.js';
test('FOMC meeting days from the Fed calendar markup', ()=>{
 const html='<h4>2026 FOMC Meetings</h4><div class="fomc-meeting__month col-xs-5"><strong>October</strong></div><div class="fomc-meeting__date col-xs-4">27-28</div><div class="fomc-meeting__month"><strong>December</strong></div><div class="fomc-meeting__date">8-9*</div><h4>2025 FOMC Meetings</h4>';
 const e=parseFomc(html,[2026]);assert.deepEqual(e.map(x=>[x.date,x.key]),[['2026-10-27','fomc-day1'],['2026-10-28','fomc'],['2026-12-08','fomc-day1'],['2026-12-09','fomc']]);assert.ok(e[3].title.includes('경제전망'));
});
test('latest results by release type', ()=>{
 const rel=k=>releases.find(r=>r.key===k);
 assert.equal(latestResult(rel('jobs'),[{d:'2026-08-01',v:1000},{d:'2026-09-01',v:1029}]).value,29);
 assert.equal(latestResult(rel('cpi'),[{d:'2025-09-01',v:100},{d:'2026-08-01',v:102},{d:'2026-09-01',v:103}]).value,3);
 assert.equal(latestResult(rel('sentiment'),[{d:'2026-09-01',v:1}]),null);
});
