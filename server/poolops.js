/**
 * AŞAMA 175 — Havuz Ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('poolops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pol_1', pool: "Ana",
      ph: "7.2", status: 'ok', at: new Date().toISOString() }];
    writeCollection('poolops', seed);
    return seed;
  }
  return list;
}
export function listPoolops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPoolops(input, actor = 'system') {
  const row = {
    id: `pol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pool: input.pool !== undefined ? input.pool : "Ana",
    ph: input.ph !== undefined ? input.ph : "7.2",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('poolops', row, 300);
  appendAudit({ actor, action: 'poolops.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updatePoolops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('poolops', list);
  appendAudit({ actor, action: 'poolops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function poolopsSummary() {
  const list = listPoolops();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    closed: list.filter((x) => x.status === 'closed').length, poolops: list };
}
