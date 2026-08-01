/**
 * AŞAMA 1061 — Breach Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('breachlog3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bre_1', severity: "Alpha",
      vector: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('breachlog3', seed);
    return seed;
  }
  return list;
}
export function listBreachlog3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBreachlog3(input, actor = 'system') {
  const row = {
    id: `bre_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    severity: input.severity !== undefined ? input.severity : "Alpha",
    vector: input.vector !== undefined ? input.vector : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('breachlog3', row, 300);
  appendAudit({
    actor,
    action: 'breachlog3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBreachlog3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('breachlog3', list);
  appendAudit({ actor, action: 'breachlog3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function breachlog3Summary() {
  const list = listBreachlog3();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, breachlog3: list };
}
