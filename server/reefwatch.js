/**
 * AŞAMA 689 — Reef Watch.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('reefwatch', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rfw_1', sector: "East",
      note: "Clear", status: 'ok', at: new Date().toISOString() }];
    writeCollection('reefwatch', seed);
    return seed;
  }
  return list;
}
export function listReefwatch(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createReefwatch(input, actor = 'system') {
  const row = {
    id: `rfw_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sector: input.sector !== undefined ? input.sector : "East",
    note: input.note !== undefined ? input.note : "Clear",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('reefwatch', row, 300);
  appendAudit({
    actor,
    action: 'reefwatch.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateReefwatch(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('reefwatch', list);
  appendAudit({ actor, action: 'reefwatch.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function reefwatchSummary() {
  const list = listReefwatch();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    watch: list.filter((x) => x.status === 'watch').length,
    alert: list.filter((x) => x.status === 'alert').length, reefwatch: list };
}
