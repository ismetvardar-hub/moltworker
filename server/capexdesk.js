/**
 * AŞAMA 492 — Capex Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('capexdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cpx_1', project: "Pool pumps",
      amount: "85000", status: 'draft', at: new Date().toISOString() }];
    writeCollection('capexdesk', seed);
    return seed;
  }
  return list;
}
export function listCapexdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCapexdesk(input, actor = 'system') {
  const row = {
    id: `cpx_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    project: input.project !== undefined ? input.project : "Pool pumps",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 85000,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('capexdesk', row, 300);
  appendAudit({
    actor,
    action: 'capexdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCapexdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('capexdesk', list);
  appendAudit({ actor, action: 'capexdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function capexdeskSummary() {
  const list = listCapexdesk();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    review: list.filter((x) => x.status === 'review').length,
    approved: list.filter((x) => x.status === 'approved').length, capexdesk: list };
}
