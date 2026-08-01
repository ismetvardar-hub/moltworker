/**
 * AŞAMA 873 — Oral History.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('oralhistory', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ora_1', speaker: "Alpha",
      topic: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('oralhistory', seed);
    return seed;
  }
  return list;
}
export function listOralhistory(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOralhistory(input, actor = 'system') {
  const row = {
    id: `ora_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    speaker: input.speaker !== undefined ? input.speaker : "Alpha",
    topic: input.topic !== undefined ? input.topic : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('oralhistory', row, 300);
  appendAudit({
    actor,
    action: 'oralhistory.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOralhistory(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('oralhistory', list);
  appendAudit({ actor, action: 'oralhistory.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function oralhistorySummary() {
  const list = listOralhistory();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, oralhistory: list };
}
