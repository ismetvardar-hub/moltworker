/**
 * AŞAMA 707 — Franchise.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('franchise', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fra_1', unit: "Alpha",
      region: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('franchise', seed);
    return seed;
  }
  return list;
}
export function listFranchise(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFranchise(input, actor = 'system') {
  const row = {
    id: `fra_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    unit: input.unit !== undefined ? input.unit : "Alpha",
    region: input.region !== undefined ? input.region : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('franchise', row, 300);
  appendAudit({
    actor,
    action: 'franchise.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFranchise(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('franchise', list);
  appendAudit({ actor, action: 'franchise.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function franchiseSummary() {
  const list = listFranchise();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, franchise: list };
}
