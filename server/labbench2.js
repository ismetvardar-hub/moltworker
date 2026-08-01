/**
 * AŞAMA 1007 — Lab Bench.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('labbench2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lab_1', experiment: "Alpha",
      owner: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('labbench2', seed);
    return seed;
  }
  return list;
}
export function listLabbench2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLabbench2(input, actor = 'system') {
  const row = {
    id: `lab_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    experiment: input.experiment !== undefined ? input.experiment : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('labbench2', row, 300);
  appendAudit({
    actor,
    action: 'labbench2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLabbench2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('labbench2', list);
  appendAudit({ actor, action: 'labbench2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function labbench2Summary() {
  const list = listLabbench2();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, labbench2: list };
}
