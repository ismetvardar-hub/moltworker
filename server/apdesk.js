/**
 * AŞAMA 573 — AP Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('apdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'apd_1', vendor: "Local farm",
      amount: "42000", status: 'open', at: new Date().toISOString() }];
    writeCollection('apdesk', seed);
    return seed;
  }
  return list;
}
export function listApdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createApdesk(input, actor = 'system') {
  const row = {
    id: `apd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vendor: input.vendor !== undefined ? input.vendor : "Local farm",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 42000,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('apdesk', row, 300);
  appendAudit({
    actor,
    action: 'apdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateApdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('apdesk', list);
  appendAudit({ actor, action: 'apdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function apdeskSummary() {
  const list = listApdesk();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    approved: list.filter((x) => x.status === 'approved').length,
    paid: list.filter((x) => x.status === 'paid').length, apdesk: list };
}
