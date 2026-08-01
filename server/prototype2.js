/**
 * AŞAMA 1009 — Prototype.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('prototype2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pro_1', name: "Alpha",
      stage: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('prototype2', seed);
    return seed;
  }
  return list;
}
export function listPrototype2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPrototype2(input, actor = 'system') {
  const row = {
    id: `pro_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Alpha",
    stage: input.stage !== undefined ? input.stage : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('prototype2', row, 300);
  appendAudit({
    actor,
    action: 'prototype2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePrototype2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('prototype2', list);
  appendAudit({ actor, action: 'prototype2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function prototype2Summary() {
  const list = listPrototype2();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, prototype2: list };
}
