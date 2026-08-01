/**
 * AŞAMA 533 — Vector Store.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('vectorstore', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vct_1', index: "kb_lykia",
      docs: "8400", status: 'building', at: new Date().toISOString() }];
    writeCollection('vectorstore', seed);
    return seed;
  }
  return list;
}
export function listVectorstore(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVectorstore(input, actor = 'system') {
  const row = {
    id: `vct_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    index: input.index !== undefined ? input.index : "kb_lykia",
    docs: input.docs !== undefined ? Number(input.docs) || 0 : 8400,
    status: input.status || 'building',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('vectorstore', row, 300);
  appendAudit({
    actor,
    action: 'vectorstore.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateVectorstore(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('vectorstore', list);
  appendAudit({ actor, action: 'vectorstore.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function vectorstoreSummary() {
  const list = listVectorstore();
  return { total: list.length, building: list.filter((x) => x.status === 'building').length,
    ready: list.filter((x) => x.status === 'ready').length,
    stale: list.filter((x) => x.status === 'stale').length, vectorstore: list };
}
