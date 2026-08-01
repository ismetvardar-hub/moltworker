/**
 * AŞAMA 305 — RAG Index.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ragindex', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rag_1', corpus: "Prosedür",
      docs: "120", status: 'building', at: new Date().toISOString() }];
    writeCollection('ragindex', seed);
    return seed;
  }
  return list;
}
export function listRagindex(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRagindex(input, actor = 'system') {
  const row = {
    id: `rag_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    corpus: input.corpus !== undefined ? input.corpus : "Prosedür",
    docs: input.docs !== undefined ? Number(input.docs) || 0 : 120,
    status: input.status || 'building',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ragindex', row, 300);
  appendAudit({ actor, action: 'ragindex.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateRagindex(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ragindex', list);
  appendAudit({ actor, action: 'ragindex.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ragindexSummary() {
  const list = listRagindex();
  return { total: list.length, building: list.filter((x) => x.status === 'building').length,
    ready: list.filter((x) => x.status === 'ready').length,
    stale: list.filter((x) => x.status === 'stale').length, ragindex: list };
}
