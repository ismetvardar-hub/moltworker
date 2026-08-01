/**
 * AŞAMA 1117 — Sleep Score.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sleepscore3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sle_1', guestName: "Alpha",
      score: "5", status: 'idle', at: new Date().toISOString() }];
    writeCollection('sleepscore3', seed);
    return seed;
  }
  return list;
}
export function listSleepscore3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSleepscore3(input, actor = 'system') {
  const row = {
    id: `sle_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sleepscore3', row, 300);
  appendAudit({
    actor,
    action: 'sleepscore3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSleepscore3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sleepscore3', list);
  appendAudit({ actor, action: 'sleepscore3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sleepscore3Summary() {
  const list = listSleepscore3();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, sleepscore3: list };
}
