/**
 * AŞAMA 220 — Sommelier.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sommelier', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sml_1', wine: "Cabernet",
      table: "7", status: 'suggested', at: new Date().toISOString() }];
    writeCollection('sommelier', seed);
    return seed;
  }
  return list;
}
export function listSommelier(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSommelier(input, actor = 'system') {
  const row = {
    id: `sml_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    wine: input.wine !== undefined ? input.wine : "Cabernet",
    table: input.table !== undefined ? input.table : "7",
    status: input.status || 'suggested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sommelier', row, 300);
  appendAudit({ actor, action: 'sommelier.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateSommelier(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sommelier', list);
  appendAudit({ actor, action: 'sommelier.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sommelierSummary() {
  const list = listSommelier();
  return { total: list.length, suggested: list.filter((x) => x.status === 'suggested').length,
    accepted: list.filter((x) => x.status === 'accepted').length,
    declined: list.filter((x) => x.status === 'declined').length, sommelier: list };
}
