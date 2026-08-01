/**
 * AŞAMA 598 — Toll Pass.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tollpass', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tol_1', vehicle: "Van-3",
      amount: "85", status: 'logged', at: new Date().toISOString() }];
    writeCollection('tollpass', seed);
    return seed;
  }
  return list;
}
export function listTollpass(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTollpass(input, actor = 'system') {
  const row = {
    id: `tol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vehicle: input.vehicle !== undefined ? input.vehicle : "Van-3",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 85,
    status: input.status || 'logged',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tollpass', row, 300);
  appendAudit({
    actor,
    action: 'tollpass.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTollpass(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tollpass', list);
  appendAudit({ actor, action: 'tollpass.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tollpassSummary() {
  const list = listTollpass();
  return { total: list.length, logged: list.filter((x) => x.status === 'logged').length,
    billed: list.filter((x) => x.status === 'billed').length, tollpass: list };
}
