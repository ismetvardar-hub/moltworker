/**
 * AŞAMA 156 — Release Notes.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('releasenotes', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rel_1', version: "1.5.0",
      summary: "AŞAMA 150", status: 'draft', at: new Date().toISOString() }];
    writeCollection('releasenotes', seed);
    return seed;
  }
  return list;
}
export function listReleasenotes(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createReleasenotes(input, actor = 'system') {
  const row = {
    id: `rel_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    version: input.version !== undefined ? input.version : "1.5.0",
    summary: input.summary !== undefined ? input.summary : "AŞAMA 150",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('releasenotes', row, 300);
  appendAudit({ actor, action: 'releasenotes.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateReleasenotes(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('releasenotes', list);
  appendAudit({ actor, action: 'releasenotes.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function releasenotesSummary() {
  const list = listReleasenotes();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    published: list.filter((x) => x.status === 'published').length, releasenotes: list };
}
