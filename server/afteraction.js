/**
 * AŞAMA 374 — After Action.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('afteraction', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'afa_1', item: "Add probe",
      owner: "ATLAS", status: 'open', at: new Date().toISOString() }];
    writeCollection('afteraction', seed);
    return seed;
  }
  return list;
}
export function listAfteraction(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAfteraction(input, actor = 'system') {
  const row = {
    id: `afa_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: input.item !== undefined ? input.item : "Add probe",
    owner: input.owner !== undefined ? input.owner : "ATLAS",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('afteraction', row, 300);
  appendAudit({
    actor,
    action: 'afteraction.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAfteraction(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('afteraction', list);
  appendAudit({ actor, action: 'afteraction.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function afteractionSummary() {
  const list = listAfteraction();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    done: list.filter((x) => x.status === 'done').length,
    wontfix: list.filter((x) => x.status === 'wontfix').length, afteraction: list };
}
