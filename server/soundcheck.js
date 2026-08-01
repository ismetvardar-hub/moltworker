/**
 * AŞAMA 194 — Soundcheck.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('soundcheck', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'snd_1', stage: "Beach",
      note: "OK", status: 'pending', at: new Date().toISOString() }];
    writeCollection('soundcheck', seed);
    return seed;
  }
  return list;
}
export function listSoundcheck(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSoundcheck(input, actor = 'system') {
  const row = {
    id: `snd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    stage: input.stage !== undefined ? input.stage : "Beach",
    note: input.note !== undefined ? input.note : "OK",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('soundcheck', row, 300);
  appendAudit({ actor, action: 'soundcheck.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateSoundcheck(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('soundcheck', list);
  appendAudit({ actor, action: 'soundcheck.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function soundcheckSummary() {
  const list = listSoundcheck();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    pass: list.filter((x) => x.status === 'pass').length,
    fail: list.filter((x) => x.status === 'fail').length, soundcheck: list };
}
