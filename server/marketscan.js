/**
 * AŞAMA 842 — Market Scan.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('marketscan', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mar_1', market: "Alpha",
      score: "5", status: 'pending', at: new Date().toISOString() }];
    writeCollection('marketscan', seed);
    return seed;
  }
  return list;
}
export function listMarketscan(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMarketscan(input, actor = 'system') {
  const row = {
    id: `mar_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    market: input.market !== undefined ? input.market : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('marketscan', row, 300);
  appendAudit({
    actor,
    action: 'marketscan.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMarketscan(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('marketscan', list);
  appendAudit({ actor, action: 'marketscan.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function marketscanSummary() {
  const list = listMarketscan();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, marketscan: list };
}
