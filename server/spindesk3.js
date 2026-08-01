/**
 * AŞAMA 1167 — Spin Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('spindesk3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'spi_1', venture: "Alpha",
      owner: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('spindesk3', seed);
    return seed;
  }
  return list;
}
export function listSpindesk3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSpindesk3(input, actor = 'system') {
  const row = {
    id: `spi_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    venture: input.venture !== undefined ? input.venture : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('spindesk3', row, 300);
  appendAudit({
    actor,
    action: 'spindesk3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSpindesk3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('spindesk3', list);
  appendAudit({ actor, action: 'spindesk3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function spindesk3Summary() {
  const list = listSpindesk3();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, spindesk3: list };
}
