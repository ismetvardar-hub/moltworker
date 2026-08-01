/**
 * AŞAMA 1199 — Net Split.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('netsplit3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'net_1', segment: "Alpha",
      status: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('netsplit3', seed);
    return seed;
  }
  return list;
}
export function listNetsplit3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNetsplit3(input, actor = 'system') {
  const row = {
    id: `net_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    segment: input.segment !== undefined ? input.segment : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('netsplit3', row, 300);
  appendAudit({
    actor,
    action: 'netsplit3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNetsplit3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('netsplit3', list);
  appendAudit({ actor, action: 'netsplit3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function netsplit3Summary() {
  const list = listNetsplit3();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, netsplit3: list };
}
