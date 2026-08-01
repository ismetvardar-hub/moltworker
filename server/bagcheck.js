/**
 * AŞAMA 207 — Çanta Kontrol.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('bagcheck', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bag_1', point: "Entry",
      note: "Temiz", status: 'clear', at: new Date().toISOString() }];
    writeCollection('bagcheck', seed);
    return seed;
  }
  return list;
}
export function listBagcheck(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBagcheck(input, actor = 'system') {
  const row = {
    id: `bag_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    point: input.point !== undefined ? input.point : "Entry",
    note: input.note !== undefined ? input.note : "Temiz",
    status: input.status || 'clear',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bagcheck', row, 300);
  appendAudit({ actor, action: 'bagcheck.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateBagcheck(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bagcheck', list);
  appendAudit({ actor, action: 'bagcheck.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function bagcheckSummary() {
  const list = listBagcheck();
  return { total: list.length, clear: list.filter((x) => x.status === 'clear').length,
    hold: list.filter((x) => x.status === 'hold').length,
    alert: list.filter((x) => x.status === 'alert').length, bagcheck: list };
}
