/**
 * AŞAMA 574 — AR Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ardesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ard_1', client: "OTA",
      amount: "95000", status: 'open', at: new Date().toISOString() }];
    writeCollection('ardesk', seed);
    return seed;
  }
  return list;
}
export function listArdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createArdesk(input, actor = 'system') {
  const row = {
    id: `ard_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    client: input.client !== undefined ? input.client : "OTA",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 95000,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ardesk', row, 300);
  appendAudit({
    actor,
    action: 'ardesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateArdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ardesk', list);
  appendAudit({ actor, action: 'ardesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ardeskSummary() {
  const list = listArdesk();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    partial: list.filter((x) => x.status === 'partial').length,
    collected: list.filter((x) => x.status === 'collected').length, ardesk: list };
}
