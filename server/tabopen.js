/**
 * AŞAMA 218 — Açık Tab.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tabopen', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tab_1', guestName: "Misafir",
      balance: "350", status: 'open', at: new Date().toISOString() }];
    writeCollection('tabopen', seed);
    return seed;
  }
  return list;
}
export function listTabopen(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTabopen(input, actor = 'system') {
  const row = {
    id: `tab_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    balance: input.balance !== undefined ? Number(input.balance) || 0 : 350,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tabopen', row, 300);
  appendAudit({ actor, action: 'tabopen.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateTabopen(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tabopen', list);
  appendAudit({ actor, action: 'tabopen.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tabopenSummary() {
  const list = listTabopen();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    settling: list.filter((x) => x.status === 'settling').length,
    closed: list.filter((x) => x.status === 'closed').length, tabopen: list };
}
