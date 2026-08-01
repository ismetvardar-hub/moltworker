/**
 * AŞAMA 1070 — Co Invest.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('coinvest3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'coi_1', deal: "Alpha",
      amount: "5", status: 'draft', at: new Date().toISOString() }];
    writeCollection('coinvest3', seed);
    return seed;
  }
  return list;
}
export function listCoinvest3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCoinvest3(input, actor = 'system') {
  const row = {
    id: `coi_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    deal: input.deal !== undefined ? input.deal : "Alpha",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('coinvest3', row, 300);
  appendAudit({
    actor,
    action: 'coinvest3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCoinvest3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('coinvest3', list);
  appendAudit({ actor, action: 'coinvest3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function coinvest3Summary() {
  const list = listCoinvest3();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, coinvest3: list };
}
