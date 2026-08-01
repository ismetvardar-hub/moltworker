/**
 * AŞAMA 367 — Error Budget.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('errorbudget', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'erb_1', service: "QR pay",
      remaining: "72", status: 'healthy', at: new Date().toISOString() }];
    writeCollection('errorbudget', seed);
    return seed;
  }
  return list;
}
export function listErrorbudget(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createErrorbudget(input, actor = 'system') {
  const row = {
    id: `erb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    service: input.service !== undefined ? input.service : "QR pay",
    remaining: input.remaining !== undefined ? Number(input.remaining) || 0 : 72,
    status: input.status || 'healthy',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('errorbudget', row, 300);
  appendAudit({
    actor,
    action: 'errorbudget.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateErrorbudget(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('errorbudget', list);
  appendAudit({ actor, action: 'errorbudget.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function errorbudgetSummary() {
  const list = listErrorbudget();
  return { total: list.length, healthy: list.filter((x) => x.status === 'healthy').length,
    burn: list.filter((x) => x.status === 'burn').length,
    exhausted: list.filter((x) => x.status === 'exhausted').length, errorbudget: list };
}
