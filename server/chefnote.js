/**
 * AŞAMA 221 — Şef Notu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('chefnote', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'chn_1', note: "Taze levrek",
      shift: "Akşam", status: 'posted', at: new Date().toISOString() }];
    writeCollection('chefnote', seed);
    return seed;
  }
  return list;
}
export function listChefnote(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createChefnote(input, actor = 'system') {
  const row = {
    id: `chn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    note: input.note !== undefined ? input.note : "Taze levrek",
    shift: input.shift !== undefined ? input.shift : "Akşam",
    status: input.status || 'posted',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('chefnote', row, 300);
  appendAudit({ actor, action: 'chefnote.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateChefnote(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('chefnote', list);
  appendAudit({ actor, action: 'chefnote.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function chefnoteSummary() {
  const list = listChefnote();
  return { total: list.length, posted: list.filter((x) => x.status === 'posted').length,
    archived: list.filter((x) => x.status === 'archived').length, chefnote: list };
}
