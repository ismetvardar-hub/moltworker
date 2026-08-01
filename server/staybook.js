/**
 * AŞAMA 637 — Stay Book.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('staybook', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'stb_1', room: "Suite-1",
      nights: "3", status: 'hold', at: new Date().toISOString() }];
    writeCollection('staybook', seed);
    return seed;
  }
  return list;
}
export function listStaybook(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createStaybook(input, actor = 'system') {
  const row = {
    id: `stb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Suite-1",
    nights: input.nights !== undefined ? Number(input.nights) || 0 : 3,
    status: input.status || 'hold',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('staybook', row, 300);
  appendAudit({
    actor,
    action: 'staybook.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateStaybook(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('staybook', list);
  appendAudit({ actor, action: 'staybook.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function staybookSummary() {
  const list = listStaybook();
  return { total: list.length, hold: list.filter((x) => x.status === 'hold').length,
    confirmed: list.filter((x) => x.status === 'confirmed').length,
    inhouse: list.filter((x) => x.status === 'inhouse').length,
    departed: list.filter((x) => x.status === 'departed').length, staybook: list };
}
