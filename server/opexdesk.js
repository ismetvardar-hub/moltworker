/**
 * AŞAMA 493 — Opex Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('opexdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'opx_1', category: "Utilities",
      amount: "12000", status: 'accrued', at: new Date().toISOString() }];
    writeCollection('opexdesk', seed);
    return seed;
  }
  return list;
}
export function listOpexdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOpexdesk(input, actor = 'system') {
  const row = {
    id: `opx_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    category: input.category !== undefined ? input.category : "Utilities",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 12000,
    status: input.status || 'accrued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('opexdesk', row, 300);
  appendAudit({
    actor,
    action: 'opexdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOpexdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('opexdesk', list);
  appendAudit({ actor, action: 'opexdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function opexdeskSummary() {
  const list = listOpexdesk();
  return { total: list.length, accrued: list.filter((x) => x.status === 'accrued').length,
    paid: list.filter((x) => x.status === 'paid').length,
    variance: list.filter((x) => x.status === 'variance').length, opexdesk: list };
}
