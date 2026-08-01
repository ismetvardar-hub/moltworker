/**
 * AŞAMA 1051 — Access Gate.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('accessgate3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'acc_1', gate: "Alpha",
      policy: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('accessgate3', seed);
    return seed;
  }
  return list;
}
export function listAccessgate3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAccessgate3(input, actor = 'system') {
  const row = {
    id: `acc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    gate: input.gate !== undefined ? input.gate : "Alpha",
    policy: input.policy !== undefined ? input.policy : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('accessgate3', row, 300);
  appendAudit({
    actor,
    action: 'accessgate3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAccessgate3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('accessgate3', list);
  appendAudit({ actor, action: 'accessgate3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function accessgate3Summary() {
  const list = listAccessgate3();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, accessgate3: list };
}
