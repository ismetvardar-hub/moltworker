/**
 * AŞAMA 384 — Walk-in Flow.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('walkinflow', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wkf_1', desk: "Beach",
      count: "9", status: 'normal', at: new Date().toISOString() }];
    writeCollection('walkinflow', seed);
    return seed;
  }
  return list;
}
export function listWalkinflow(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWalkinflow(input, actor = 'system') {
  const row = {
    id: `wkf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    desk: input.desk !== undefined ? input.desk : "Beach",
    count: input.count !== undefined ? Number(input.count) || 0 : 9,
    status: input.status || 'normal',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('walkinflow', row, 300);
  appendAudit({
    actor,
    action: 'walkinflow.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWalkinflow(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('walkinflow', list);
  appendAudit({ actor, action: 'walkinflow.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function walkinflowSummary() {
  const list = listWalkinflow();
  return { total: list.length, normal: list.filter((x) => x.status === 'normal').length,
    surge: list.filter((x) => x.status === 'surge').length,
    closed: list.filter((x) => x.status === 'closed').length, walkinflow: list };
}
