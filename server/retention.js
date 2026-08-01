/**
 * AŞAMA 281 — Saklama Politikası.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('retention', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rtn_1', dataset: "CCTV",
      months: "30", status: 'active', at: new Date().toISOString() }];
    writeCollection('retention', seed);
    return seed;
  }
  return list;
}
export function listRetention(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRetention(input, actor = 'system') {
  const row = {
    id: `rtn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    dataset: input.dataset !== undefined ? input.dataset : "CCTV",
    months: input.months !== undefined ? Number(input.months) || 0 : 30,
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('retention', row, 300);
  appendAudit({ actor, action: 'retention.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateRetention(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('retention', list);
  appendAudit({ actor, action: 'retention.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function retentionSummary() {
  const list = listRetention();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    review: list.filter((x) => x.status === 'review').length, retention: list };
}
