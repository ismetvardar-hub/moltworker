/**
 * AŞAMA 634 — Tour Pack.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tourpack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tpk_1', pack: "Phaselis day",
      pax: "8", status: 'open', at: new Date().toISOString() }];
    writeCollection('tourpack', seed);
    return seed;
  }
  return list;
}
export function listTourpack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTourpack(input, actor = 'system') {
  const row = {
    id: `tpk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pack: input.pack !== undefined ? input.pack : "Phaselis day",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 8,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tourpack', row, 300);
  appendAudit({
    actor,
    action: 'tourpack.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTourpack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tourpack', list);
  appendAudit({ actor, action: 'tourpack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tourpackSummary() {
  const list = listTourpack();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    full: list.filter((x) => x.status === 'full').length,
    departed: list.filter((x) => x.status === 'departed').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length, tourpack: list };
}
