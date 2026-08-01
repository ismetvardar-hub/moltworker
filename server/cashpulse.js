/**
 * AŞAMA 740 — Cash Pulse.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('cashpulse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cas_1', bucket: "Alpha",
      amount: "5", status: 'idle', at: new Date().toISOString() }];
    writeCollection('cashpulse', seed);
    return seed;
  }
  return list;
}
export function listCashpulse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCashpulse(input, actor = 'system') {
  const row = {
    id: `cas_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bucket: input.bucket !== undefined ? input.bucket : "Alpha",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5,
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cashpulse', row, 300);
  appendAudit({
    actor,
    action: 'cashpulse.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCashpulse(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cashpulse', list);
  appendAudit({ actor, action: 'cashpulse.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cashpulseSummary() {
  const list = listCashpulse();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, cashpulse: list };
}
