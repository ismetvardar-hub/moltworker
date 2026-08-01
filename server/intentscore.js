/**
 * AŞAMA 348 — Niyet Skoru.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('intentscore', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'its_1', guestName: "Misafir",
      score: "72", status: 'low', at: new Date().toISOString() }];
    writeCollection('intentscore', seed);
    return seed;
  }
  return list;
}
export function listIntentscore(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIntentscore(input, actor = 'system') {
  const row = {
    id: `its_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    score: input.score !== undefined ? Number(input.score) || 0 : 72,
    status: input.status || 'low',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('intentscore', row, 300);
  appendAudit({
    actor,
    action: 'intentscore.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateIntentscore(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('intentscore', list);
  appendAudit({ actor, action: 'intentscore.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function intentscoreSummary() {
  const list = listIntentscore();
  return { total: list.length, low: list.filter((x) => x.status === 'low').length,
    medium: list.filter((x) => x.status === 'medium').length,
    high: list.filter((x) => x.status === 'high').length, intentscore: list };
}
