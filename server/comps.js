/**
 * AŞAMA 216 — Comp.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('comps', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cmp_1', guestName: "Misafir",
      amount: "80", status: 'requested', at: new Date().toISOString() }];
    writeCollection('comps', seed);
    return seed;
  }
  return list;
}
export function listComps(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createComps(input, actor = 'system') {
  const row = {
    id: `cmp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 80,
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('comps', row, 300);
  appendAudit({ actor, action: 'comps.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateComps(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('comps', list);
  appendAudit({ actor, action: 'comps.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function compsSummary() {
  const list = listComps();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    denied: list.filter((x) => x.status === 'denied').length, comps: list };
}
