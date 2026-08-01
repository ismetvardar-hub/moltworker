/**
 * AŞAMA 556 — Campdesk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('campdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cmpn_1', name: "Summer escape",
      channel: "Meta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('campdesk', seed);
    return seed;
  }
  return list;
}
export function listCampdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCampdesk(input, actor = 'system') {
  const row = {
    id: `cmpn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Summer escape",
    channel: input.channel !== undefined ? input.channel : "Meta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('campdesk', row, 300);
  appendAudit({
    actor,
    action: 'campdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCampdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('campdesk', list);
  appendAudit({ actor, action: 'campdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function campdeskSummary() {
  const list = listCampdesk();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    paused: list.filter((x) => x.status === 'paused').length,
    ended: list.filter((x) => x.status === 'ended').length, campdesk: list };
}
