/**
 * AŞAMA 376 — Gelir Akışı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('revstream', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rvs_1', channel: "F&B",
      amount: "52000", status: 'live', at: new Date().toISOString() }];
    writeCollection('revstream', seed);
    return seed;
  }
  return list;
}
export function listRevstream(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRevstream(input, actor = 'system') {
  const row = {
    id: `rvs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    channel: input.channel !== undefined ? input.channel : "F&B",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 52000,
    status: input.status || 'live',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('revstream', row, 300);
  appendAudit({
    actor,
    action: 'revstream.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRevstream(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('revstream', list);
  appendAudit({ actor, action: 'revstream.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function revstreamSummary() {
  const list = listRevstream();
  return { total: list.length, live: list.filter((x) => x.status === 'live').length,
    locked: list.filter((x) => x.status === 'locked').length, revstream: list };
}
