/**
 * AŞAMA 876 — Founders Note.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('foundersnote', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fou_1', title: "Alpha",
      year: "5", status: 'pending', at: new Date().toISOString() }];
    writeCollection('foundersnote', seed);
    return seed;
  }
  return list;
}
export function listFoundersnote(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFoundersnote(input, actor = 'system') {
  const row = {
    id: `fou_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Alpha",
    year: input.year !== undefined ? Number(input.year) || 0 : 5,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('foundersnote', row, 300);
  appendAudit({
    actor,
    action: 'foundersnote.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFoundersnote(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('foundersnote', list);
  appendAudit({ actor, action: 'foundersnote.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function foundersnoteSummary() {
  const list = listFoundersnote();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, foundersnote: list };
}
