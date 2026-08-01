/**
 * AŞAMA 582 — Cost Center.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('costcenter', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ccn_1', code: "FB-01",
      name: "Main kitchen", status: 'active', at: new Date().toISOString() }];
    writeCollection('costcenter', seed);
    return seed;
  }
  return list;
}
export function listCostcenter(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCostcenter(input, actor = 'system') {
  const row = {
    id: `ccn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    code: input.code !== undefined ? input.code : "FB-01",
    name: input.name !== undefined ? input.name : "Main kitchen",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('costcenter', row, 300);
  appendAudit({
    actor,
    action: 'costcenter.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCostcenter(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('costcenter', list);
  appendAudit({ actor, action: 'costcenter.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function costcenterSummary() {
  const list = listCostcenter();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    frozen: list.filter((x) => x.status === 'frozen').length,
    closed: list.filter((x) => x.status === 'closed').length, costcenter: list };
}
