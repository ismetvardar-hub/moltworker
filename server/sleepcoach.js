/**
 * AŞAMA 476 — Sleep Coach.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sleepcoach', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'slp_1', guestName: "Misafir",
      score: "72", status: 'enrolled', at: new Date().toISOString() }];
    writeCollection('sleepcoach', seed);
    return seed;
  }
  return list;
}
export function listSleepcoach(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSleepcoach(input, actor = 'system') {
  const row = {
    id: `slp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    score: input.score !== undefined ? Number(input.score) || 0 : 72,
    status: input.status || 'enrolled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sleepcoach', row, 300);
  appendAudit({
    actor,
    action: 'sleepcoach.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSleepcoach(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sleepcoach', list);
  appendAudit({ actor, action: 'sleepcoach.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sleepcoachSummary() {
  const list = listSleepcoach();
  return { total: list.length, enrolled: list.filter((x) => x.status === 'enrolled').length,
    tracking: list.filter((x) => x.status === 'tracking').length,
    graduated: list.filter((x) => x.status === 'graduated').length, sleepcoach: list };
}
