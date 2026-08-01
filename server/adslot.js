/**
 * AŞAMA 663 — Ad Slot.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('adslot', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ads2_1', slot: "IG Story",
      buyer: "Partner", status: 'open', at: new Date().toISOString() }];
    writeCollection('adslot', seed);
    return seed;
  }
  return list;
}
export function listAdslot(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAdslot(input, actor = 'system') {
  const row = {
    id: `ads2_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    slot: input.slot !== undefined ? input.slot : "IG Story",
    buyer: input.buyer !== undefined ? input.buyer : "Partner",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('adslot', row, 300);
  appendAudit({
    actor,
    action: 'adslot.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAdslot(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('adslot', list);
  appendAudit({ actor, action: 'adslot.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function adslotSummary() {
  const list = listAdslot();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    sold: list.filter((x) => x.status === 'sold').length,
    filled: list.filter((x) => x.status === 'filled').length, adslot: list };
}
