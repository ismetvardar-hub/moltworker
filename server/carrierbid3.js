/**
 * AŞAMA 1088 — Carrier Bid.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('carrierbid3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'car_1', lane: "Alpha",
      rate: "5", status: 'ok', at: new Date().toISOString() }];
    writeCollection('carrierbid3', seed);
    return seed;
  }
  return list;
}
export function listCarrierbid3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCarrierbid3(input, actor = 'system') {
  const row = {
    id: `car_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    lane: input.lane !== undefined ? input.lane : "Alpha",
    rate: input.rate !== undefined ? Number(input.rate) || 0 : 5,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('carrierbid3', row, 300);
  appendAudit({
    actor,
    action: 'carrierbid3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCarrierbid3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('carrierbid3', list);
  appendAudit({ actor, action: 'carrierbid3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function carrierbid3Summary() {
  const list = listCarrierbid3();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, carrierbid3: list };
}
