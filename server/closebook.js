/**
 * AŞAMA 584 — Close Book.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('closebook', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'clb2_1', period: "2026-07",
      owner: "CFO", status: 'open', at: new Date().toISOString() }];
    writeCollection('closebook', seed);
    return seed;
  }
  return list;
}
export function listClosebook(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createClosebook(input, actor = 'system') {
  const row = {
    id: `clb2_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    period: input.period !== undefined ? input.period : "2026-07",
    owner: input.owner !== undefined ? input.owner : "CFO",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('closebook', row, 300);
  appendAudit({
    actor,
    action: 'closebook.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateClosebook(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('closebook', list);
  appendAudit({ actor, action: 'closebook.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function closebookSummary() {
  const list = listClosebook();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    review: list.filter((x) => x.status === 'review').length,
    closed: list.filter((x) => x.status === 'closed').length, closebook: list };
}
