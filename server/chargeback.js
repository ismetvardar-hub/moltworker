/**
 * AŞAMA 248 — Chargeback.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('chargeback', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'chb_1', caseId: "CB-01",
      amount: "900", status: 'open', at: new Date().toISOString() }];
    writeCollection('chargeback', seed);
    return seed;
  }
  return list;
}
export function listChargeback(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createChargeback(input, actor = 'system') {
  const row = {
    id: `chb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    caseId: input.caseId !== undefined ? input.caseId : "CB-01",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 900,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('chargeback', row, 300);
  appendAudit({ actor, action: 'chargeback.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateChargeback(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('chargeback', list);
  appendAudit({ actor, action: 'chargeback.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function chargebackSummary() {
  const list = listChargeback();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    won: list.filter((x) => x.status === 'won').length,
    lost: list.filter((x) => x.status === 'lost').length, chargeback: list };
}
