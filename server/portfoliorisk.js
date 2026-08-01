/**
 * AŞAMA 395 — Portföy Risk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('portfoliorisk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prk_1', asset: "OlymposPass",
      score: "28", status: 'low', at: new Date().toISOString() }];
    writeCollection('portfoliorisk', seed);
    return seed;
  }
  return list;
}
export function listPortfoliorisk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPortfoliorisk(input, actor = 'system') {
  const row = {
    id: `prk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "OlymposPass",
    score: input.score !== undefined ? Number(input.score) || 0 : 28,
    status: input.status || 'low',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('portfoliorisk', row, 300);
  appendAudit({
    actor,
    action: 'portfoliorisk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePortfoliorisk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('portfoliorisk', list);
  appendAudit({ actor, action: 'portfoliorisk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function portfolioriskSummary() {
  const list = listPortfoliorisk();
  return { total: list.length, low: list.filter((x) => x.status === 'low').length,
    medium: list.filter((x) => x.status === 'medium').length,
    high: list.filter((x) => x.status === 'high').length, portfoliorisk: list };
}
