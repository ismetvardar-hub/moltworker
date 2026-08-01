/**
 * AŞAMA 1004 — Ritual Cal.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ritualcal2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rit_1', ritual: "Alpha",
      date: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('ritualcal2', seed);
    return seed;
  }
  return list;
}
export function listRitualcal2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRitualcal2(input, actor = 'system') {
  const row = {
    id: `rit_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ritual: input.ritual !== undefined ? input.ritual : "Alpha",
    date: input.date !== undefined ? input.date : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ritualcal2', row, 300);
  appendAudit({
    actor,
    action: 'ritualcal2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRitualcal2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ritualcal2', list);
  appendAudit({ actor, action: 'ritualcal2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ritualcal2Summary() {
  const list = listRitualcal2();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, ritualcal2: list };
}
