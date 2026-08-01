/**
 * AŞAMA 517 — Hazmat Bay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('hazmatbay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hzm_1', bay: "Chem-1",
      sku: "Chlorine", status: 'secured', at: new Date().toISOString() }];
    writeCollection('hazmatbay', seed);
    return seed;
  }
  return list;
}
export function listHazmatbay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHazmatbay(input, actor = 'system') {
  const row = {
    id: `hzm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bay: input.bay !== undefined ? input.bay : "Chem-1",
    sku: input.sku !== undefined ? input.sku : "Chlorine",
    status: input.status || 'secured',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hazmatbay', row, 300);
  appendAudit({
    actor,
    action: 'hazmatbay.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHazmatbay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('hazmatbay', list);
  appendAudit({ actor, action: 'hazmatbay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function hazmatbaySummary() {
  const list = listHazmatbay();
  return { total: list.length, secured: list.filter((x) => x.status === 'secured').length,
    open: list.filter((x) => x.status === 'open').length,
    spill: list.filter((x) => x.status === 'spill').length, hazmatbay: list };
}
