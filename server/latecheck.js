/**
 * AŞAMA 621 — Late Check.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('latecheck', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lck_1', room: "412",
      until: "16:00", status: 'requested', at: new Date().toISOString() }];
    writeCollection('latecheck', seed);
    return seed;
  }
  return list;
}
export function listLatecheck(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLatecheck(input, actor = 'system') {
  const row = {
    id: `lck_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    until: input.until !== undefined ? input.until : "16:00",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('latecheck', row, 300);
  appendAudit({
    actor,
    action: 'latecheck.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLatecheck(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('latecheck', list);
  appendAudit({ actor, action: 'latecheck.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function latecheckSummary() {
  const list = listLatecheck();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    denied: list.filter((x) => x.status === 'denied').length, latecheck: list };
}
