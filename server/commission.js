/**
 * AŞAMA 718 — Commission.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('commission', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'com_1', partner: "Alpha",
      pct: "5", status: 'draft', at: new Date().toISOString() }];
    writeCollection('commission', seed);
    return seed;
  }
  return list;
}
export function listCommission(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCommission(input, actor = 'system') {
  const row = {
    id: `com_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    partner: input.partner !== undefined ? input.partner : "Alpha",
    pct: input.pct !== undefined ? Number(input.pct) || 0 : 5,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('commission', row, 300);
  appendAudit({
    actor,
    action: 'commission.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCommission(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('commission', list);
  appendAudit({ actor, action: 'commission.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function commissionSummary() {
  const list = listCommission();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, commission: list };
}
