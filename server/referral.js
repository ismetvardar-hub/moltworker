/**
 * AŞAMA 545 — Referral.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('referral', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rfr_1', referrer: "A",
      referee: "B", status: 'invited', at: new Date().toISOString() }];
    writeCollection('referral', seed);
    return seed;
  }
  return list;
}
export function listReferral(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createReferral(input, actor = 'system') {
  const row = {
    id: `rfr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    referrer: input.referrer !== undefined ? input.referrer : "A",
    referee: input.referee !== undefined ? input.referee : "B",
    status: input.status || 'invited',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('referral', row, 300);
  appendAudit({
    actor,
    action: 'referral.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateReferral(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('referral', list);
  appendAudit({ actor, action: 'referral.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function referralSummary() {
  const list = listReferral();
  return { total: list.length, invited: list.filter((x) => x.status === 'invited').length,
    booked: list.filter((x) => x.status === 'booked').length,
    rewarded: list.filter((x) => x.status === 'rewarded').length, referral: list };
}
