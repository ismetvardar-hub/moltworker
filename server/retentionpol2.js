/**
 * AŞAMA 1033 — Retention Pol.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('retentionpol2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ret_1', dataset: "Alpha",
      days: "5", status: 'planned', at: new Date().toISOString() }];
    writeCollection('retentionpol2', seed);
    return seed;
  }
  return list;
}
export function listRetentionpol2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRetentionpol2(input, actor = 'system') {
  const row = {
    id: `ret_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    dataset: input.dataset !== undefined ? input.dataset : "Alpha",
    days: input.days !== undefined ? Number(input.days) || 0 : 5,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('retentionpol2', row, 300);
  appendAudit({
    actor,
    action: 'retentionpol2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRetentionpol2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('retentionpol2', list);
  appendAudit({ actor, action: 'retentionpol2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function retentionpol2Summary() {
  const list = listRetentionpol2();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, retentionpol2: list };
}
