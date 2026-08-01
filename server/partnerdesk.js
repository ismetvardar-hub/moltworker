/**
 * AŞAMA 706 — Partner Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('partnerdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'par_1', partner: "Alpha",
      tier: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('partnerdesk', seed);
    return seed;
  }
  return list;
}
export function listPartnerdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPartnerdesk(input, actor = 'system') {
  const row = {
    id: `par_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    partner: input.partner !== undefined ? input.partner : "Alpha",
    tier: input.tier !== undefined ? input.tier : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('partnerdesk', row, 300);
  appendAudit({
    actor,
    action: 'partnerdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePartnerdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('partnerdesk', list);
  appendAudit({ actor, action: 'partnerdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function partnerdeskSummary() {
  const list = listPartnerdesk();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, partnerdesk: list };
}
