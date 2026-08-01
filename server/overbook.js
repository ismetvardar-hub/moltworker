/**
 * AŞAMA 253 — Overbooking.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('overbook', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ovb_1', date: "2026-08-15",
      rooms: "2", status: 'proposed', at: new Date().toISOString() }];
    writeCollection('overbook', seed);
    return seed;
  }
  return list;
}
export function listOverbook(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOverbook(input, actor = 'system') {
  const row = {
    id: `ovb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    date: input.date !== undefined ? input.date : "2026-08-15",
    rooms: input.rooms !== undefined ? Number(input.rooms) || 0 : 2,
    status: input.status || 'proposed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('overbook', row, 300);
  appendAudit({ actor, action: 'overbook.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateOverbook(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('overbook', list);
  appendAudit({ actor, action: 'overbook.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function overbookSummary() {
  const list = listOverbook();
  return { total: list.length, proposed: list.filter((x) => x.status === 'proposed').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, overbook: list };
}
