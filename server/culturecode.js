/**
 * AŞAMA 401 — Culture Code.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('culturecode', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'clc_1', principle: "Centilmenlik",
      owner: "ETHOS", status: 'draft', at: new Date().toISOString() }];
    writeCollection('culturecode', seed);
    return seed;
  }
  return list;
}
export function listCulturecode(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCulturecode(input, actor = 'system') {
  const row = {
    id: `clc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    principle: input.principle !== undefined ? input.principle : "Centilmenlik",
    owner: input.owner !== undefined ? input.owner : "ETHOS",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('culturecode', row, 300);
  appendAudit({
    actor,
    action: 'culturecode.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCulturecode(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('culturecode', list);
  appendAudit({ actor, action: 'culturecode.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function culturecodeSummary() {
  const list = listCulturecode();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    ratified: list.filter((x) => x.status === 'ratified').length, culturecode: list };
}
