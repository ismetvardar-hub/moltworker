/**
 * AŞAMA 467 — Thermal Bay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('thermalbay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'thm_1', bay: "Hammam",
      tempC: "42", status: 'open', at: new Date().toISOString() }];
    writeCollection('thermalbay', seed);
    return seed;
  }
  return list;
}
export function listThermalbay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createThermalbay(input, actor = 'system') {
  const row = {
    id: `thm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bay: input.bay !== undefined ? input.bay : "Hammam",
    tempC: input.tempC !== undefined ? Number(input.tempC) || 0 : 42,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('thermalbay', row, 300);
  appendAudit({
    actor,
    action: 'thermalbay.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateThermalbay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('thermalbay', list);
  appendAudit({ actor, action: 'thermalbay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function thermalbaySummary() {
  const list = listThermalbay();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    busy: list.filter((x) => x.status === 'busy').length,
    closed: list.filter((x) => x.status === 'closed').length, thermalbay: list };
}
