/**
 * AŞAMA 559 — Creator Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('creatordesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'crd_1', creator: "@travel",
      deliverable: "Story", status: 'pitched', at: new Date().toISOString() }];
    writeCollection('creatordesk', seed);
    return seed;
  }
  return list;
}
export function listCreatordesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCreatordesk(input, actor = 'system') {
  const row = {
    id: `crd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    creator: input.creator !== undefined ? input.creator : "@travel",
    deliverable: input.deliverable !== undefined ? input.deliverable : "Story",
    status: input.status || 'pitched',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('creatordesk', row, 300);
  appendAudit({
    actor,
    action: 'creatordesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCreatordesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('creatordesk', list);
  appendAudit({ actor, action: 'creatordesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function creatordeskSummary() {
  const list = listCreatordesk();
  return { total: list.length, pitched: list.filter((x) => x.status === 'pitched').length,
    live: list.filter((x) => x.status === 'live').length,
    paid: list.filter((x) => x.status === 'paid').length, creatordesk: list };
}
