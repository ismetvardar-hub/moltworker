/**
 * AŞAMA 896 — Aegis Final.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('aegisfinal', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'aeg_1', layer: "Alpha",
      status: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('aegisfinal', seed);
    return seed;
  }
  return list;
}
export function listAegisfinal(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAegisfinal(input, actor = 'system') {
  const row = {
    id: `aeg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    layer: input.layer !== undefined ? input.layer : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('aegisfinal', row, 300);
  appendAudit({
    actor,
    action: 'aegisfinal.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAegisfinal(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('aegisfinal', list);
  appendAudit({ actor, action: 'aegisfinal.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function aegisfinalSummary() {
  const list = listAegisfinal();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, aegisfinal: list };
}
