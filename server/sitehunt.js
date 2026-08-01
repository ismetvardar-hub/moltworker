/**
 * AŞAMA 843 — Site Hunt.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sitehunt', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sit_1', city: "Alpha",
      score: "5", status: 'idle', at: new Date().toISOString() }];
    writeCollection('sitehunt', seed);
    return seed;
  }
  return list;
}
export function listSitehunt(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSitehunt(input, actor = 'system') {
  const row = {
    id: `sit_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    city: input.city !== undefined ? input.city : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sitehunt', row, 300);
  appendAudit({
    actor,
    action: 'sitehunt.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSitehunt(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sitehunt', list);
  appendAudit({ actor, action: 'sitehunt.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sitehuntSummary() {
  const list = listSitehunt();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, sitehunt: list };
}
