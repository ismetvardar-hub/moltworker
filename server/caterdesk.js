/**
 * AŞAMA 460 — Cater Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('caterdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ctd_1', event: "Board lunch",
      covers: "18", status: 'quoted', at: new Date().toISOString() }];
    writeCollection('caterdesk', seed);
    return seed;
  }
  return list;
}
export function listCaterdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCaterdesk(input, actor = 'system') {
  const row = {
    id: `ctd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    event: input.event !== undefined ? input.event : "Board lunch",
    covers: input.covers !== undefined ? Number(input.covers) || 0 : 18,
    status: input.status || 'quoted',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('caterdesk', row, 300);
  appendAudit({
    actor,
    action: 'caterdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCaterdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('caterdesk', list);
  appendAudit({ actor, action: 'caterdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function caterdeskSummary() {
  const list = listCaterdesk();
  return { total: list.length, quoted: list.filter((x) => x.status === 'quoted').length,
    confirmed: list.filter((x) => x.status === 'confirmed').length,
    done: list.filter((x) => x.status === 'done').length, caterdesk: list };
}
