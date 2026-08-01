/**
 * AŞAMA 359 — Wow Moment.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wowmoment', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wow_1', guestName: "Misafir",
      moment: "Doğum günü", status: 'planned', at: new Date().toISOString() }];
    writeCollection('wowmoment', seed);
    return seed;
  }
  return list;
}
export function listWowmoment(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWowmoment(input, actor = 'system') {
  const row = {
    id: `wow_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    moment: input.moment !== undefined ? input.moment : "Doğum günü",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wowmoment', row, 300);
  appendAudit({
    actor,
    action: 'wowmoment.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWowmoment(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wowmoment', list);
  appendAudit({ actor, action: 'wowmoment.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wowmomentSummary() {
  const list = listWowmoment();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    skipped: list.filter((x) => x.status === 'skipped').length, wowmoment: list };
}
