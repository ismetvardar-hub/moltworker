/**
 * AŞAMA 199 — İlk Yardım.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('firstaid', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'aid_1', location: "Havuz",
      note: "Sıyrık", status: 'open', at: new Date().toISOString() }];
    writeCollection('firstaid', seed);
    return seed;
  }
  return list;
}
export function listFirstaid(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFirstaid(input, actor = 'system') {
  const row = {
    id: `aid_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    location: input.location !== undefined ? input.location : "Havuz",
    note: input.note !== undefined ? input.note : "Sıyrık",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('firstaid', row, 300);
  appendAudit({ actor, action: 'firstaid.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateFirstaid(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('firstaid', list);
  appendAudit({ actor, action: 'firstaid.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function firstaidSummary() {
  const list = listFirstaid();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    treated: list.filter((x) => x.status === 'treated').length,
    referred: list.filter((x) => x.status === 'referred').length, firstaid: list };
}
