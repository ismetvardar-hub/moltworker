/**
 * AŞAMA 298 — Embargo.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('mediaembargo', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'emb_1', title: "Yeni menü",
      until: "2026-08-10", status: 'active', at: new Date().toISOString() }];
    writeCollection('mediaembargo', seed);
    return seed;
  }
  return list;
}
export function listMediaembargo(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMediaembargo(input, actor = 'system') {
  const row = {
    id: `emb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Yeni menü",
    until: input.until !== undefined ? input.until : "2026-08-10",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mediaembargo', row, 300);
  appendAudit({ actor, action: 'mediaembargo.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateMediaembargo(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mediaembargo', list);
  appendAudit({ actor, action: 'mediaembargo.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function mediaembargoSummary() {
  const list = listMediaembargo();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    lifted: list.filter((x) => x.status === 'lifted').length, mediaembargo: list };
}
