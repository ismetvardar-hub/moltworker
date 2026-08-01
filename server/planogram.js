/**
 * AŞAMA 647 — Planogram.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('planogram', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'plg_1', bay: "A-3",
      sku: "DAZE-TEE", status: 'ok', at: new Date().toISOString() }];
    writeCollection('planogram', seed);
    return seed;
  }
  return list;
}
export function listPlanogram(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPlanogram(input, actor = 'system') {
  const row = {
    id: `plg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bay: input.bay !== undefined ? input.bay : "A-3",
    sku: input.sku !== undefined ? input.sku : "DAZE-TEE",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('planogram', row, 300);
  appendAudit({
    actor,
    action: 'planogram.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePlanogram(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('planogram', list);
  appendAudit({ actor, action: 'planogram.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function planogramSummary() {
  const list = listPlanogram();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    gap: list.filter((x) => x.status === 'gap').length,
    overstock: list.filter((x) => x.status === 'overstock').length, planogram: list };
}
