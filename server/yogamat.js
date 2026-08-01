/**
 * AŞAMA 472 — Yoga Mat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('yogamat', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'yog_1', className: "Sunrise flow",
      pax: "12", status: 'open', at: new Date().toISOString() }];
    writeCollection('yogamat', seed);
    return seed;
  }
  return list;
}
export function listYogamat(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createYogamat(input, actor = 'system') {
  const row = {
    id: `yog_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    className: input.className !== undefined ? input.className : "Sunrise flow",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 12,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('yogamat', row, 300);
  appendAudit({
    actor,
    action: 'yogamat.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateYogamat(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('yogamat', list);
  appendAudit({ actor, action: 'yogamat.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function yogamatSummary() {
  const list = listYogamat();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    full: list.filter((x) => x.status === 'full').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length, yogamat: list };
}
