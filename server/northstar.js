/**
 * AŞAMA 404 — North Star.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('northstar', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'nst_1', metric: "Happy Guest Days",
      value: "12840", status: 'tracking', at: new Date().toISOString() }];
    writeCollection('northstar', seed);
    return seed;
  }
  return list;
}
export function listNorthstar(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNorthstar(input, actor = 'system') {
  const row = {
    id: `nst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    metric: input.metric !== undefined ? input.metric : "Happy Guest Days",
    value: input.value !== undefined ? Number(input.value) || 0 : 12840,
    status: input.status || 'tracking',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('northstar', row, 300);
  appendAudit({
    actor,
    action: 'northstar.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNorthstar(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('northstar', list);
  appendAudit({ actor, action: 'northstar.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function northstarSummary() {
  const list = listNorthstar();
  return { total: list.length, tracking: list.filter((x) => x.status === 'tracking').length,
    hit: list.filter((x) => x.status === 'hit').length,
    miss: list.filter((x) => x.status === 'miss').length, northstar: list };
}
