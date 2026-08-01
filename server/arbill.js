/**
 * AŞAMA 241 — AR Fatura.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('arbill', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'arb_1', customer: "Kurumsal A",
      amount: "15000",
      aging: "30", status: 'current', at: new Date().toISOString() }];
    writeCollection('arbill', seed);
    return seed;
  }
  return list;
}
export function listArbill(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createArbill(input, actor = 'system') {
  const row = {
    id: `arb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    customer: input.customer !== undefined ? input.customer : "Kurumsal A",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 15000,
    aging: input.aging !== undefined ? Number(input.aging) || 0 : 30,
    status: input.status || 'current',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('arbill', row, 300);
  appendAudit({ actor, action: 'arbill.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateArbill(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('arbill', list);
  appendAudit({ actor, action: 'arbill.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function arbillSummary() {
  const list = listArbill();
  return { total: list.length, current: list.filter((x) => x.status === 'current').length,
    overdue: list.filter((x) => x.status === 'overdue').length,
    collected: list.filter((x) => x.status === 'collected').length, arbill: list };
}
