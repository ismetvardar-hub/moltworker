/**
 * AŞAMA 1089 — Freight Bill.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('freightbill3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fre_1', carrier: "Alpha",
      amount: "5", status: 'planned', at: new Date().toISOString() }];
    writeCollection('freightbill3', seed);
    return seed;
  }
  return list;
}
export function listFreightbill3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFreightbill3(input, actor = 'system') {
  const row = {
    id: `fre_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    carrier: input.carrier !== undefined ? input.carrier : "Alpha",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('freightbill3', row, 300);
  appendAudit({
    actor,
    action: 'freightbill3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFreightbill3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('freightbill3', list);
  appendAudit({ actor, action: 'freightbill3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function freightbill3Summary() {
  const list = listFreightbill3();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, freightbill3: list };
}
