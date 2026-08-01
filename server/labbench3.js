/**
 * AŞAMA 1157 — Lab Bench.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('labbench3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lab_1', experiment: "Alpha",
      owner: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('labbench3', seed);
    return seed;
  }
  return list;
}
export function listLabbench3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLabbench3(input, actor = 'system') {
  const row = {
    id: `lab_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    experiment: input.experiment !== undefined ? input.experiment : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('labbench3', row, 300);
  appendAudit({
    actor,
    action: 'labbench3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLabbench3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('labbench3', list);
  appendAudit({ actor, action: 'labbench3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function labbench3Summary() {
  const list = listLabbench3();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, labbench3: list };
}
