/**
 * AŞAMA 605 — Found Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('foundlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fnd_1', item: "Watch",
      room: "508", status: 'held', at: new Date().toISOString() }];
    writeCollection('foundlog', seed);
    return seed;
  }
  return list;
}
export function listFoundlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFoundlog(input, actor = 'system') {
  const row = {
    id: `fnd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: input.item !== undefined ? input.item : "Watch",
    room: input.room !== undefined ? input.room : "508",
    status: input.status || 'held',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('foundlog', row, 300);
  appendAudit({
    actor,
    action: 'foundlog.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFoundlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('foundlog', list);
  appendAudit({ actor, action: 'foundlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function foundlogSummary() {
  const list = listFoundlog();
  return { total: list.length, held: list.filter((x) => x.status === 'held').length,
    claimed: list.filter((x) => x.status === 'claimed').length,
    disposed: list.filter((x) => x.status === 'disposed').length, foundlog: list };
}
