/**
 * AŞAMA 548 — Stay History.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('stayhistory', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sth_1', guestName: "Misafir",
      nights: "4", status: 'past', at: new Date().toISOString() }];
    writeCollection('stayhistory', seed);
    return seed;
  }
  return list;
}
export function listStayhistory(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createStayhistory(input, actor = 'system') {
  const row = {
    id: `sth_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    nights: input.nights !== undefined ? Number(input.nights) || 0 : 4,
    status: input.status || 'past',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('stayhistory', row, 300);
  appendAudit({
    actor,
    action: 'stayhistory.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateStayhistory(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('stayhistory', list);
  appendAudit({ actor, action: 'stayhistory.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function stayhistorySummary() {
  const list = listStayhistory();
  return { total: list.length, past: list.filter((x) => x.status === 'past').length,
    current: list.filter((x) => x.status === 'current').length,
    future: list.filter((x) => x.status === 'future').length, stayhistory: list };
}
