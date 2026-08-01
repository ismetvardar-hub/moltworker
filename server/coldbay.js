/**
 * AŞAMA 425 — Soğuk Bay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('coldbay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cby_1', bay: "Cold-2",
      tempC: "2", status: 'ok', at: new Date().toISOString() }];
    writeCollection('coldbay', seed);
    return seed;
  }
  return list;
}
export function listColdbay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createColdbay(input, actor = 'system') {
  const row = {
    id: `cby_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bay: input.bay !== undefined ? input.bay : "Cold-2",
    tempC: input.tempC !== undefined ? Number(input.tempC) || 0 : 2,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('coldbay', row, 300);
  appendAudit({
    actor,
    action: 'coldbay.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateColdbay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('coldbay', list);
  appendAudit({ actor, action: 'coldbay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function coldbaySummary() {
  const list = listColdbay();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, coldbay: list };
}
