/**
 * AŞAMA 730 — Milestone T.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('milestonet', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mil_1', shipment: "Alpha",
      eta: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('milestonet', seed);
    return seed;
  }
  return list;
}
export function listMilestonet(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMilestonet(input, actor = 'system') {
  const row = {
    id: `mil_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    shipment: input.shipment !== undefined ? input.shipment : "Alpha",
    eta: input.eta !== undefined ? input.eta : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('milestonet', row, 300);
  appendAudit({
    actor,
    action: 'milestonet.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMilestonet(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('milestonet', list);
  appendAudit({ actor, action: 'milestonet.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function milestonetSummary() {
  const list = listMilestonet();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, milestonet: list };
}
