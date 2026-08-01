/**
 * AŞAMA 250 — Üyelik Fatura.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('memberbill', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mbill_1', member: "Altın Üye",
      amount: "3990", status: 'issued', at: new Date().toISOString() }];
    writeCollection('memberbill', seed);
    return seed;
  }
  return list;
}
export function listMemberbill(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMemberbill(input, actor = 'system') {
  const row = {
    id: `mbill_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    member: input.member !== undefined ? input.member : "Altın Üye",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 3990,
    status: input.status || 'issued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('memberbill', row, 300);
  appendAudit({ actor, action: 'memberbill.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateMemberbill(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('memberbill', list);
  appendAudit({ actor, action: 'memberbill.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function memberbillSummary() {
  const list = listMemberbill();
  return { total: list.length, issued: list.filter((x) => x.status === 'issued').length,
    paid: list.filter((x) => x.status === 'paid').length,
    overdue: list.filter((x) => x.status === 'overdue').length, memberbill: list };
}
