/**
 * AŞAMA 302 — Prompt Lib.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('promptlib', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prm_1', name: "Komuta brief",
      agent: "LİKYA-1", status: 'draft', at: new Date().toISOString() }];
    writeCollection('promptlib', seed);
    return seed;
  }
  return list;
}
export function listPromptlib(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPromptlib(input, actor = 'system') {
  const row = {
    id: `prm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Komuta brief",
    agent: input.agent !== undefined ? input.agent : "LİKYA-1",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('promptlib', row, 300);
  appendAudit({ actor, action: 'promptlib.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updatePromptlib(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('promptlib', list);
  appendAudit({ actor, action: 'promptlib.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function promptlibSummary() {
  const list = listPromptlib();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    approved: list.filter((x) => x.status === 'approved').length,
    deprecated: list.filter((x) => x.status === 'deprecated').length, promptlib: list };
}
