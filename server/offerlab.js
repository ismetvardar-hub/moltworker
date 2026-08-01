/**
 * AŞAMA 352 — Offer Lab.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('offerlab', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ofl_1', offer: "Late checkout+",
      variant: "B", status: 'draft', at: new Date().toISOString() }];
    writeCollection('offerlab', seed);
    return seed;
  }
  return list;
}
export function listOfferlab(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOfferlab(input, actor = 'system') {
  const row = {
    id: `ofl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    offer: input.offer !== undefined ? input.offer : "Late checkout+",
    variant: input.variant !== undefined ? input.variant : "B",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('offerlab', row, 300);
  appendAudit({
    actor,
    action: 'offerlab.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOfferlab(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('offerlab', list);
  appendAudit({ actor, action: 'offerlab.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function offerlabSummary() {
  const list = listOfferlab();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    running: list.filter((x) => x.status === 'running').length,
    winner: list.filter((x) => x.status === 'winner').length, offerlab: list };
}
