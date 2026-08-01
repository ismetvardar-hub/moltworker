/**
 * AŞAMA 215 — Void Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('voidlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vod_1', station: "POS-1",
      amount: "120", status: 'logged', at: new Date().toISOString() }];
    writeCollection('voidlog', seed);
    return seed;
  }
  return list;
}
export function listVoidlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVoidlog(input, actor = 'system') {
  const row = {
    id: `vod_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    station: input.station !== undefined ? input.station : "POS-1",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 120,
    status: input.status || 'logged',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('voidlog', row, 300);
  appendAudit({ actor, action: 'voidlog.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateVoidlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('voidlog', list);
  appendAudit({ actor, action: 'voidlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function voidlogSummary() {
  const list = listVoidlog();
  return { total: list.length, logged: list.filter((x) => x.status === 'logged').length,
    reviewed: list.filter((x) => x.status === 'reviewed').length,
    disputed: list.filter((x) => x.status === 'disputed').length, voidlog: list };
}
