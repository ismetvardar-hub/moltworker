/**
 * AŞAMA 246 — Depozito.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('deposit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dep_1', guestName: "Misafir",
      amount: "2000", status: 'held', at: new Date().toISOString() }];
    writeCollection('deposit', seed);
    return seed;
  }
  return list;
}
export function listDeposit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDeposit(input, actor = 'system') {
  const row = {
    id: `dep_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 2000,
    status: input.status || 'held',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('deposit', row, 300);
  appendAudit({ actor, action: 'deposit.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateDeposit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('deposit', list);
  appendAudit({ actor, action: 'deposit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function depositSummary() {
  const list = listDeposit();
  return { total: list.length, held: list.filter((x) => x.status === 'held').length,
    released: list.filter((x) => x.status === 'released').length,
    forfeited: list.filter((x) => x.status === 'forfeited').length, deposit: list };
}
