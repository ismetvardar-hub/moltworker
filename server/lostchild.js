/**
 * AŞAMA 198 — Kayıp Çocuk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('lostchild', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lch_1', childName: "Ada",
      zone: "Kids", status: 'open', at: new Date().toISOString() }];
    writeCollection('lostchild', seed);
    return seed;
  }
  return list;
}
export function listLostchild(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLostchild(input, actor = 'system') {
  const row = {
    id: `lch_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    childName: input.childName !== undefined ? input.childName : "Ada",
    zone: input.zone !== undefined ? input.zone : "Kids",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lostchild', row, 300);
  appendAudit({ actor, action: 'lostchild.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateLostchild(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lostchild', list);
  appendAudit({ actor, action: 'lostchild.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function lostchildSummary() {
  const list = listLostchild();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    found: list.filter((x) => x.status === 'found').length,
    closed: list.filter((x) => x.status === 'closed').length, lostchild: list };
}
