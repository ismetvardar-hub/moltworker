/**
 * AŞAMA 347 — Tercih Grafı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('prefgraph', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pfg_1', guestName: "Misafir",
      pref: "Sessiz oda", status: 'known', at: new Date().toISOString() }];
    writeCollection('prefgraph', seed);
    return seed;
  }
  return list;
}
export function listPrefgraph(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPrefgraph(input, actor = 'system') {
  const row = {
    id: `pfg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    pref: input.pref !== undefined ? input.pref : "Sessiz oda",
    status: input.status || 'known',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('prefgraph', row, 300);
  appendAudit({
    actor,
    action: 'prefgraph.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePrefgraph(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('prefgraph', list);
  appendAudit({ actor, action: 'prefgraph.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function prefgraphSummary() {
  const list = listPrefgraph();
  return { total: list.length, known: list.filter((x) => x.status === 'known').length,
    inferred: list.filter((x) => x.status === 'inferred').length,
    conflict: list.filter((x) => x.status === 'conflict').length, prefgraph: list };
}
