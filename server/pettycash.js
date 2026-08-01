/**
 * AŞAMA 581 — Petty Cash.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pettycash', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ptc_1', till: "Front desk",
      balance: "2500", status: 'ok', at: new Date().toISOString() }];
    writeCollection('pettycash', seed);
    return seed;
  }
  return list;
}
export function listPettycash(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPettycash(input, actor = 'system') {
  const row = {
    id: `ptc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    till: input.till !== undefined ? input.till : "Front desk",
    balance: input.balance !== undefined ? Number(input.balance) || 0 : 2500,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pettycash', row, 300);
  appendAudit({
    actor,
    action: 'pettycash.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePettycash(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pettycash', list);
  appendAudit({ actor, action: 'pettycash.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pettycashSummary() {
  const list = listPettycash();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    low: list.filter((x) => x.status === 'low').length,
    over: list.filter((x) => x.status === 'over').length, pettycash: list };
}
