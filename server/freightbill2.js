/**
 * AŞAMA 939 — Freight Bill.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('freightbill2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fre_1', carrier: "Alpha",
      amount: "5", status: 'planned', at: new Date().toISOString() }];
    writeCollection('freightbill2', seed);
    return seed;
  }
  return list;
}
export function listFreightbill2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFreightbill2(input, actor = 'system') {
  const row = {
    id: `fre_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    carrier: input.carrier !== undefined ? input.carrier : "Alpha",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('freightbill2', row, 300);
  appendAudit({
    actor,
    action: 'freightbill2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFreightbill2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('freightbill2', list);
  appendAudit({ actor, action: 'freightbill2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function freightbill2Summary() {
  const list = listFreightbill2();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, freightbill2: list };
}
