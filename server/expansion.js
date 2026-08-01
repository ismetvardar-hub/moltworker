/**
 * AŞAMA 399 — Expansion.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('expansion', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'exp_1', city: "Kaş",
      phase: "Scout", status: 'scout', at: new Date().toISOString() }];
    writeCollection('expansion', seed);
    return seed;
  }
  return list;
}
export function listExpansion(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createExpansion(input, actor = 'system') {
  const row = {
    id: `exp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    city: input.city !== undefined ? input.city : "Kaş",
    phase: input.phase !== undefined ? input.phase : "Scout",
    status: input.status || 'scout',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('expansion', row, 300);
  appendAudit({
    actor,
    action: 'expansion.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateExpansion(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('expansion', list);
  appendAudit({ actor, action: 'expansion.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function expansionSummary() {
  const list = listExpansion();
  return { total: list.length, scout: list.filter((x) => x.status === 'scout').length,
    build: list.filter((x) => x.status === 'build').length,
    open: list.filter((x) => x.status === 'open').length, expansion: list };
}
