/**
 * AŞAMA 1136 — Error Budget.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('errorbudget4', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'err_1', service: "Alpha",
      burn: "5", status: 'open', at: new Date().toISOString() }];
    writeCollection('errorbudget4', seed);
    return seed;
  }
  return list;
}
export function listErrorbudget4(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createErrorbudget4(input, actor = 'system') {
  const row = {
    id: `err_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    service: input.service !== undefined ? input.service : "Alpha",
    burn: input.burn !== undefined ? Number(input.burn) || 0 : 5,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('errorbudget4', row, 300);
  appendAudit({
    actor,
    action: 'errorbudget4.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateErrorbudget4(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('errorbudget4', list);
  appendAudit({ actor, action: 'errorbudget4.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function errorbudget4Summary() {
  const list = listErrorbudget4();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, errorbudget4: list };
}
