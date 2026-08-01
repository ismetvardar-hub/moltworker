/**
 * AŞAMA 549 — Prefer Note.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('prefernote', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pfn2_1', guestName: "Misafir",
      pref: "High floor", status: 'noted', at: new Date().toISOString() }];
    writeCollection('prefernote', seed);
    return seed;
  }
  return list;
}
export function listPrefernote(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPrefernote(input, actor = 'system') {
  const row = {
    id: `pfn2_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    pref: input.pref !== undefined ? input.pref : "High floor",
    status: input.status || 'noted',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('prefernote', row, 300);
  appendAudit({
    actor,
    action: 'prefernote.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePrefernote(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('prefernote', list);
  appendAudit({ actor, action: 'prefernote.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function prefernoteSummary() {
  const list = listPrefernote();
  return { total: list.length, noted: list.filter((x) => x.status === 'noted').length,
    applied: list.filter((x) => x.status === 'applied').length,
    stale: list.filter((x) => x.status === 'stale').length, prefernote: list };
}
