import test from 'node:test';
import assert from 'node:assert/strict';
import {etInstant,slotWindow} from '../src/publish-schedule.js';
test('ET wall time converts across DST',()=>{
 assert.equal(etInstant(2026,10,5,9,15).toISOString(),'2026-10-05T13:15:00.000Z');
 assert.equal(etInstant(2026,11,2,9,15).toISOString(),'2026-11-02T14:15:00.000Z');
});
test('slots skip weekends',()=>{
 const {prev,next}=slotWindow(new Date('2026-10-03T15:00:00Z'),17,15);
 assert.equal(prev.toISOString(),'2026-10-02T21:15:00.000Z');
 assert.equal(next.toISOString(),'2026-10-05T21:15:00.000Z');
 const am=slotWindow(new Date('2026-10-05T12:00:00Z'),9,15);
 assert.equal(am.next.toISOString(),'2026-10-05T13:15:00.000Z');
});
