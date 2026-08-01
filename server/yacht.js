/**
 * AŞAMA 183 — Yat Charter.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('yacht', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'yac_1', vessel: "Likya One",
      pax: "8", status: 'inquiry', at: new Date().toISOString() }];
    writeCollection('yacht', seed);
    return seed;
  }
  return list;
}
export function listYacht(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createYacht(input, actor = 'system') {
  const row = {
    id: `yac_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vessel: input.vessel !== undefined ? input.vessel : "Likya One",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 8,
    status: input.status || 'inquiry',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('yacht', row, 300);
  appendAudit({ actor, action: 'yacht.create', detail: String(row.title || row.guestName || row.vessel || row.unit || row.slot || row.board || row.lane || row.room || row.machine || row.table || row.theme || row.dj || row.stage || row.flight || row.level || row.id), meta: { id: row.id } });
  return row;
}
export function updateYacht(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('yacht', list);
  appendAudit({ actor, action: 'yacht.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function yachtSummary() {
  const list = listYacht();
  return { total: list.length, inquiry: list.filter((x) => x.status === 'inquiry').length,
    chartered: list.filter((x) => x.status === 'chartered').length,
    docked: list.filter((x) => x.status === 'docked').length, yacht: list };
}
