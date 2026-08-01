/**
 * AŞAMA 505 — Review Cycle.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('reviewcycle', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rvc_1', cycle: "H2-2026",
      due: "2026-12-01", status: 'open', at: new Date().toISOString() }];
    writeCollection('reviewcycle', seed);
    return seed;
  }
  return list;
}
export function listReviewcycle(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createReviewcycle(input, actor = 'system') {
  const row = {
    id: `rvc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    cycle: input.cycle !== undefined ? input.cycle : "H2-2026",
    due: input.due !== undefined ? input.due : "2026-12-01",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('reviewcycle', row, 300);
  appendAudit({
    actor,
    action: 'reviewcycle.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateReviewcycle(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('reviewcycle', list);
  appendAudit({ actor, action: 'reviewcycle.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function reviewcycleSummary() {
  const list = listReviewcycle();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    calibrating: list.filter((x) => x.status === 'calibrating').length,
    closed: list.filter((x) => x.status === 'closed').length, reviewcycle: list };
}
