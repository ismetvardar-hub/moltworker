/**
 * AŞAMA 383 — No-show Risk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('noshowrisk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'nsr_1', reservation: "R-441",
      risk: "22", status: 'low', at: new Date().toISOString() }];
    writeCollection('noshowrisk', seed);
    return seed;
  }
  return list;
}
export function listNoshowrisk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNoshowrisk(input, actor = 'system') {
  const row = {
    id: `nsr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    reservation: input.reservation !== undefined ? input.reservation : "R-441",
    risk: input.risk !== undefined ? Number(input.risk) || 0 : 22,
    status: input.status || 'low',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('noshowrisk', row, 300);
  appendAudit({
    actor,
    action: 'noshowrisk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNoshowrisk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('noshowrisk', list);
  appendAudit({ actor, action: 'noshowrisk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function noshowriskSummary() {
  const list = listNoshowrisk();
  return { total: list.length, low: list.filter((x) => x.status === 'low').length,
    medium: list.filter((x) => x.status === 'medium').length,
    high: list.filter((x) => x.status === 'high').length, noshowrisk: list };
}
