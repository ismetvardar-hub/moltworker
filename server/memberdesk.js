/**
 * AŞAMA 541 — Member Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('memberdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mbd_1', guestName: "Misafir",
      tier: "Gold", status: 'active', at: new Date().toISOString() }];
    writeCollection('memberdesk', seed);
    return seed;
  }
  return list;
}
export function listMemberdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMemberdesk(input, actor = 'system') {
  const row = {
    id: `mbd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    tier: input.tier !== undefined ? input.tier : "Gold",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('memberdesk', row, 300);
  appendAudit({
    actor,
    action: 'memberdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMemberdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('memberdesk', list);
  appendAudit({ actor, action: 'memberdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function memberdeskSummary() {
  const list = listMemberdesk();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length,
    churned: list.filter((x) => x.status === 'churned').length, memberdesk: list };
}
