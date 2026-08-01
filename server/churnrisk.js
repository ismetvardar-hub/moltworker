/**
 * AŞAMA 358 — Churn Risk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('churnrisk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'chr_1', guestName: "Misafir",
      risk: "34", status: 'low', at: new Date().toISOString() }];
    writeCollection('churnrisk', seed);
    return seed;
  }
  return list;
}
export function listChurnrisk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createChurnrisk(input, actor = 'system') {
  const row = {
    id: `chr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    risk: input.risk !== undefined ? Number(input.risk) || 0 : 34,
    status: input.status || 'low',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('churnrisk', row, 300);
  appendAudit({
    actor,
    action: 'churnrisk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateChurnrisk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('churnrisk', list);
  appendAudit({ actor, action: 'churnrisk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function churnriskSummary() {
  const list = listChurnrisk();
  return { total: list.length, low: list.filter((x) => x.status === 'low').length,
    medium: list.filter((x) => x.status === 'medium').length,
    high: list.filter((x) => x.status === 'high').length, churnrisk: list };
}
