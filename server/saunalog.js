/**
 * AŞAMA 468 — Sauna Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('saunalog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sau_1', room: "Finnish",
      pax: "6", status: 'ready', at: new Date().toISOString() }];
    writeCollection('saunalog', seed);
    return seed;
  }
  return list;
}
export function listSaunalog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSaunalog(input, actor = 'system') {
  const row = {
    id: `sau_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Finnish",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 6,
    status: input.status || 'ready',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('saunalog', row, 300);
  appendAudit({
    actor,
    action: 'saunalog.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSaunalog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('saunalog', list);
  appendAudit({ actor, action: 'saunalog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function saunalogSummary() {
  const list = listSaunalog();
  return { total: list.length, ready: list.filter((x) => x.status === 'ready').length,
    session: list.filter((x) => x.status === 'session').length,
    cool: list.filter((x) => x.status === 'cool').length, saunalog: list };
}
