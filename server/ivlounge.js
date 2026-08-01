/**
 * AŞAMA 475 — IV Lounge.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ivlounge', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ivl_1', protocol: "Hydration",
      guestName: "Misafir", status: 'consult', at: new Date().toISOString() }];
    writeCollection('ivlounge', seed);
    return seed;
  }
  return list;
}
export function listIvlounge(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIvlounge(input, actor = 'system') {
  const row = {
    id: `ivl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    protocol: input.protocol !== undefined ? input.protocol : "Hydration",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'consult',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ivlounge', row, 300);
  appendAudit({
    actor,
    action: 'ivlounge.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateIvlounge(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ivlounge', list);
  appendAudit({ actor, action: 'ivlounge.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ivloungeSummary() {
  const list = listIvlounge();
  return { total: list.length, consult: list.filter((x) => x.status === 'consult').length,
    drip: list.filter((x) => x.status === 'drip').length,
    done: list.filter((x) => x.status === 'done').length, ivlounge: list };
}
