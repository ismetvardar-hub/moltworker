/**
 * AŞAMA 243 — Banka Mutabakat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('bankrec', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bnk_1', account: "TRY-01",
      delta: "0", status: 'matched', at: new Date().toISOString() }];
    writeCollection('bankrec', seed);
    return seed;
  }
  return list;
}
export function listBankrec(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBankrec(input, actor = 'system') {
  const row = {
    id: `bnk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    account: input.account !== undefined ? input.account : "TRY-01",
    delta: input.delta !== undefined ? Number(input.delta) || 0 : 0,
    status: input.status || 'matched',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bankrec', row, 300);
  appendAudit({ actor, action: 'bankrec.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateBankrec(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bankrec', list);
  appendAudit({ actor, action: 'bankrec.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function bankrecSummary() {
  const list = listBankrec();
  return { total: list.length, matched: list.filter((x) => x.status === 'matched').length,
    open: list.filter((x) => x.status === 'open').length,
    adjusted: list.filter((x) => x.status === 'adjusted').length, bankrec: list };
}
