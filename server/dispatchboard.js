/**
 * AŞAMA 591 — Dispatch Board.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('dispatchboard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dsp_1', job: "VIP pickup",
      vehicle: "Van-3", status: 'queued', at: new Date().toISOString() }];
    writeCollection('dispatchboard', seed);
    return seed;
  }
  return list;
}
export function listDispatchboard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDispatchboard(input, actor = 'system') {
  const row = {
    id: `dsp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    job: input.job !== undefined ? input.job : "VIP pickup",
    vehicle: input.vehicle !== undefined ? input.vehicle : "Van-3",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dispatchboard', row, 300);
  appendAudit({
    actor,
    action: 'dispatchboard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDispatchboard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dispatchboard', list);
  appendAudit({ actor, action: 'dispatchboard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dispatchboardSummary() {
  const list = listDispatchboard();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    dispatched: list.filter((x) => x.status === 'dispatched').length,
    closed: list.filter((x) => x.status === 'closed').length, dispatchboard: list };
}
