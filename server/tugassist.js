/**
 * AŞAMA 432 — Römorkör.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tugassist', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tug_1', tug: "Tug-2",
      vessel: "Yacht-A", status: 'standby', at: new Date().toISOString() }];
    writeCollection('tugassist', seed);
    return seed;
  }
  return list;
}
export function listTugassist(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTugassist(input, actor = 'system') {
  const row = {
    id: `tug_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    tug: input.tug !== undefined ? input.tug : "Tug-2",
    vessel: input.vessel !== undefined ? input.vessel : "Yacht-A",
    status: input.status || 'standby',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tugassist', row, 300);
  appendAudit({
    actor,
    action: 'tugassist.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTugassist(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tugassist', list);
  appendAudit({ actor, action: 'tugassist.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tugassistSummary() {
  const list = listTugassist();
  return { total: list.length, standby: list.filter((x) => x.status === 'standby').length,
    engaged: list.filter((x) => x.status === 'engaged').length,
    released: list.filter((x) => x.status === 'released').length, tugassist: list };
}
