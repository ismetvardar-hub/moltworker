/**
 * AŞAMA 808 — Research Note.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('researchnote', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'res_1', topic: "Alpha",
      author: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('researchnote', seed);
    return seed;
  }
  return list;
}
export function listResearchnote(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createResearchnote(input, actor = 'system') {
  const row = {
    id: `res_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    topic: input.topic !== undefined ? input.topic : "Alpha",
    author: input.author !== undefined ? input.author : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('researchnote', row, 300);
  appendAudit({
    actor,
    action: 'researchnote.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateResearchnote(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('researchnote', list);
  appendAudit({ actor, action: 'researchnote.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function researchnoteSummary() {
  const list = listResearchnote();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, researchnote: list };
}
