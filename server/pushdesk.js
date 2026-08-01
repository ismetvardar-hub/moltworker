/**
 * AŞAMA 564 — Push Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pushdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'psh_1', title: "Sunset offer",
      segment: "VIP", status: 'draft', at: new Date().toISOString() }];
    writeCollection('pushdesk', seed);
    return seed;
  }
  return list;
}
export function listPushdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPushdesk(input, actor = 'system') {
  const row = {
    id: `psh_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Sunset offer",
    segment: input.segment !== undefined ? input.segment : "VIP",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pushdesk', row, 300);
  appendAudit({
    actor,
    action: 'pushdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePushdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pushdesk', list);
  appendAudit({ actor, action: 'pushdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pushdeskSummary() {
  const list = listPushdesk();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    scheduled: list.filter((x) => x.status === 'scheduled').length,
    sent: list.filter((x) => x.status === 'sent').length, pushdesk: list };
}
