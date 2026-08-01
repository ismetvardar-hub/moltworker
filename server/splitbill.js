/**
 * AŞAMA 217 — Hesap Böl.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('splitbill', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'spl_1', table: "12",
      parts: "3", status: 'open', at: new Date().toISOString() }];
    writeCollection('splitbill', seed);
    return seed;
  }
  return list;
}
export function listSplitbill(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSplitbill(input, actor = 'system') {
  const row = {
    id: `spl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    table: input.table !== undefined ? input.table : "12",
    parts: input.parts !== undefined ? Number(input.parts) || 0 : 3,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('splitbill', row, 300);
  appendAudit({ actor, action: 'splitbill.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateSplitbill(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('splitbill', list);
  appendAudit({ actor, action: 'splitbill.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function splitbillSummary() {
  const list = listSplitbill();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    done: list.filter((x) => x.status === 'done').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length, splitbill: list };
}
