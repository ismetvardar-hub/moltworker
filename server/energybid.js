/**
 * AŞAMA 679 — Energy Bid.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('energybid', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'enb_1', block: "Peak",
      mwh: "2.5", status: 'bid', at: new Date().toISOString() }];
    writeCollection('energybid', seed);
    return seed;
  }
  return list;
}
export function listEnergybid(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEnergybid(input, actor = 'system') {
  const row = {
    id: `enb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    block: input.block !== undefined ? input.block : "Peak",
    mwh: input.mwh !== undefined ? Number(input.mwh) || 0 : 2.5,
    status: input.status || 'bid',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('energybid', row, 300);
  appendAudit({
    actor,
    action: 'energybid.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEnergybid(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('energybid', list);
  appendAudit({ actor, action: 'energybid.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function energybidSummary() {
  const list = listEnergybid();
  return { total: list.length, bid: list.filter((x) => x.status === 'bid').length,
    won: list.filter((x) => x.status === 'won').length,
    settled: list.filter((x) => x.status === 'settled').length, energybid: list };
}
