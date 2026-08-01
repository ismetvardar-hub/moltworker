/**
 * AŞAMA 504 — Perform Note.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('performnote', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pfn_1', person: "Ela",
      score: "4", status: 'draft', at: new Date().toISOString() }];
    writeCollection('performnote', seed);
    return seed;
  }
  return list;
}
export function listPerformnote(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPerformnote(input, actor = 'system') {
  const row = {
    id: `pfn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    person: input.person !== undefined ? input.person : "Ela",
    score: input.score !== undefined ? Number(input.score) || 0 : 4,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('performnote', row, 300);
  appendAudit({
    actor,
    action: 'performnote.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePerformnote(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('performnote', list);
  appendAudit({ actor, action: 'performnote.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function performnoteSummary() {
  const list = listPerformnote();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    shared: list.filter((x) => x.status === 'shared').length,
    archived: list.filter((x) => x.status === 'archived').length, performnote: list };
}
