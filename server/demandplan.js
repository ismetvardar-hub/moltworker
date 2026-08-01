/**
 * AŞAMA 655 — Demand Plan.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('demandplan', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dmp_1', sku: "DAZE-TEE",
      units: "300", status: 'draft', at: new Date().toISOString() }];
    writeCollection('demandplan', seed);
    return seed;
  }
  return list;
}
export function listDemandplan(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDemandplan(input, actor = 'system') {
  const row = {
    id: `dmp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "DAZE-TEE",
    units: input.units !== undefined ? Number(input.units) || 0 : 300,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('demandplan', row, 300);
  appendAudit({
    actor,
    action: 'demandplan.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDemandplan(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('demandplan', list);
  appendAudit({ actor, action: 'demandplan.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function demandplanSummary() {
  const list = listDemandplan();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    locked: list.filter((x) => x.status === 'locked').length,
    miss: list.filter((x) => x.status === 'miss').length, demandplan: list };
}
