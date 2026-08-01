/**
 * AŞAMA 414 — Yelken Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('saildesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sld_1', boat: "Likya II",
      guestName: "Misafir", status: 'booked', at: new Date().toISOString() }];
    writeCollection('saildesk', seed);
    return seed;
  }
  return list;
}
export function listSaildesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSaildesk(input, actor = 'system') {
  const row = {
    id: `sld_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    boat: input.boat !== undefined ? input.boat : "Likya II",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('saildesk', row, 300);
  appendAudit({
    actor,
    action: 'saildesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSaildesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('saildesk', list);
  appendAudit({ actor, action: 'saildesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function saildeskSummary() {
  const list = listSaildesk();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    sailing: list.filter((x) => x.status === 'sailing').length,
    docked: list.filter((x) => x.status === 'docked').length, saildesk: list };
}
