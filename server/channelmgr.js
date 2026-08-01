/**
 * AŞAMA 252 — Channel Manager.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('channelmgr', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'chm_1', channel: "Booking",
      roomType: "Deluxe", status: 'mapped', at: new Date().toISOString() }];
    writeCollection('channelmgr', seed);
    return seed;
  }
  return list;
}
export function listChannelmgr(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createChannelmgr(input, actor = 'system') {
  const row = {
    id: `chm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    channel: input.channel !== undefined ? input.channel : "Booking",
    roomType: input.roomType !== undefined ? input.roomType : "Deluxe",
    status: input.status || 'mapped',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('channelmgr', row, 300);
  appendAudit({ actor, action: 'channelmgr.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateChannelmgr(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('channelmgr', list);
  appendAudit({ actor, action: 'channelmgr.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function channelmgrSummary() {
  const list = listChannelmgr();
  return { total: list.length, mapped: list.filter((x) => x.status === 'mapped').length,
    error: list.filter((x) => x.status === 'error').length,
    paused: list.filter((x) => x.status === 'paused').length, channelmgr: list };
}
