/**
 * AŞAMA 672 — Boost Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('boostdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bst_1', asset: "Reel-22",
      budget: "5000", status: 'draft', at: new Date().toISOString() }];
    writeCollection('boostdesk', seed);
    return seed;
  }
  return list;
}
export function listBoostdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBoostdesk(input, actor = 'system') {
  const row = {
    id: `bst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Reel-22",
    budget: input.budget !== undefined ? Number(input.budget) || 0 : 5000,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('boostdesk', row, 300);
  appendAudit({
    actor,
    action: 'boostdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBoostdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('boostdesk', list);
  appendAudit({ actor, action: 'boostdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function boostdeskSummary() {
  const list = listBoostdesk();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    running: list.filter((x) => x.status === 'running').length,
    spent: list.filter((x) => x.status === 'spent').length, boostdesk: list };
}
