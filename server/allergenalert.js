/**
 * AŞAMA 212 — Alerjen Alarm.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('allergenalert', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ala_1', dish: "Salad",
      flag: "Fındık", status: 'open', at: new Date().toISOString() }];
    writeCollection('allergenalert', seed);
    return seed;
  }
  return list;
}
export function listAllergenalert(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAllergenalert(input, actor = 'system') {
  const row = {
    id: `ala_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    dish: input.dish !== undefined ? input.dish : "Salad",
    flag: input.flag !== undefined ? input.flag : "Fındık",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('allergenalert', row, 300);
  appendAudit({ actor, action: 'allergenalert.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updateAllergenalert(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('allergenalert', list);
  appendAudit({ actor, action: 'allergenalert.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function allergenalertSummary() {
  const list = listAllergenalert();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    acked: list.filter((x) => x.status === 'acked').length,
    cleared: list.filter((x) => x.status === 'cleared').length, allergenalert: list };
}
