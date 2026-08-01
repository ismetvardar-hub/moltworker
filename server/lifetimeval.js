/**
 * AŞAMA 357 — LTV.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('lifetimeval', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ltv_1', guestName: "Misafir",
      value: "42000", status: 'estimated', at: new Date().toISOString() }];
    writeCollection('lifetimeval', seed);
    return seed;
  }
  return list;
}
export function listLifetimeval(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLifetimeval(input, actor = 'system') {
  const row = {
    id: `ltv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    value: input.value !== undefined ? Number(input.value) || 0 : 42000,
    status: input.status || 'estimated',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lifetimeval', row, 300);
  appendAudit({
    actor,
    action: 'lifetimeval.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLifetimeval(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lifetimeval', list);
  appendAudit({ actor, action: 'lifetimeval.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function lifetimevalSummary() {
  const list = listLifetimeval();
  return { total: list.length, estimated: list.filter((x) => x.status === 'estimated').length,
    confirmed: list.filter((x) => x.status === 'confirmed').length, lifetimeval: list };
}
