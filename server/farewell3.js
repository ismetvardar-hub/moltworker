/**
 * AŞAMA 1119 — Farewell.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('farewell3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'far_1', guestName: "Alpha",
      gift: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('farewell3', seed);
    return seed;
  }
  return list;
}
export function listFarewell3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFarewell3(input, actor = 'system') {
  const row = {
    id: `far_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Alpha",
    gift: input.gift !== undefined ? input.gift : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('farewell3', row, 300);
  appendAudit({
    actor,
    action: 'farewell3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFarewell3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('farewell3', list);
  appendAudit({ actor, action: 'farewell3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function farewell3Summary() {
  const list = listFarewell3();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, farewell3: list };
}
