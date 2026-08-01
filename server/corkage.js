/**
 * AŞAMA 219 — Corkage.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('corkage', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'crk_1', table: "5",
      bottles: "1", status: 'charged', at: new Date().toISOString() }];
    writeCollection('corkage', seed);
    return seed;
  }
  return list;
}
export function listCorkage(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCorkage(input, actor = 'system') {
  const row = {
    id: `crk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    table: input.table !== undefined ? input.table : "5",
    bottles: input.bottles !== undefined ? Number(input.bottles) || 0 : 1,
    status: input.status || 'charged',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('corkage', row, 300);
  appendAudit({ actor, action: 'corkage.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateCorkage(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('corkage', list);
  appendAudit({ actor, action: 'corkage.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function corkageSummary() {
  const list = listCorkage();
  return { total: list.length, charged: list.filter((x) => x.status === 'charged').length,
    waived: list.filter((x) => x.status === 'waived').length, corkage: list };
}
