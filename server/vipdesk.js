/**
 * AŞAMA 547 — VIP Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('vipdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vip_1', guestName: "Misafir",
      handler: "Concierge", status: 'arriving', at: new Date().toISOString() }];
    writeCollection('vipdesk', seed);
    return seed;
  }
  return list;
}
export function listVipdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVipdesk(input, actor = 'system') {
  const row = {
    id: `vip_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    handler: input.handler !== undefined ? input.handler : "Concierge",
    status: input.status || 'arriving',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('vipdesk', row, 300);
  appendAudit({
    actor,
    action: 'vipdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateVipdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('vipdesk', list);
  appendAudit({ actor, action: 'vipdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function vipdeskSummary() {
  const list = listVipdesk();
  return { total: list.length, arriving: list.filter((x) => x.status === 'arriving').length,
    inhouse: list.filter((x) => x.status === 'inhouse').length,
    departed: list.filter((x) => x.status === 'departed').length, vipdesk: list };
}
