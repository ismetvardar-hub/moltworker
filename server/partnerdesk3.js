/**
 * AŞAMA 1066 — Partner Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('partnerdesk3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'par_1', partner: "Alpha",
      tier: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('partnerdesk3', seed);
    return seed;
  }
  return list;
}
export function listPartnerdesk3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPartnerdesk3(input, actor = 'system') {
  const row = {
    id: `par_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    partner: input.partner !== undefined ? input.partner : "Alpha",
    tier: input.tier !== undefined ? input.tier : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('partnerdesk3', row, 300);
  appendAudit({
    actor,
    action: 'partnerdesk3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePartnerdesk3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('partnerdesk3', list);
  appendAudit({ actor, action: 'partnerdesk3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function partnerdesk3Summary() {
  const list = listPartnerdesk3();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, partnerdesk3: list };
}
