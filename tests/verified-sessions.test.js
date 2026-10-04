import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedSessions,auditSources} from '../src/verified-sessions.js';
test('dated records keep Nike after-hours release separate from next-day response',()=>{
  const first=verifiedSessions['2026-10-01'].events[0];
  assert.equal(first.releaseDate,'2026-10-01');
  assert.equal(first.reactionDate,'2026-10-02');
  assert.match(first.facts,/42.8%/);
  assert.match(first.facts,/\+60bp/);
});
test('every observation and event has a resolvable provenance',()=>{
  for(const [date,s] of Object.entries(verifiedSessions)){
    assert.ok(auditSources[s.marketSource]);
    for(const o of s.observations)assert.ok(auditSources[o.source]);
    for(const e of s.events){assert.ok(auditSources[e.source]);assert.ok(auditSources[e.reactionSource]);assert.ok(e.releaseDate<=date);assert.ok(e.reactionDate>=e.releaseDate);}
  }
});
test('the two sessions preserve opposite yield directions and unknown dates',()=>{
  assert.match(verifiedSessions['2026-10-01'].markets[3][1],/−5.9bp/);
  assert.match(verifiedSessions['2026-10-02'].markets[3][1],/\+4.5bp/);
  assert.equal(verifiedSessions['2026-10-03'],undefined);
});
