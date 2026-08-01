/**
 * AŞAMA 713 — Lead Share.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('leadshare', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lea_1', lead: "Alpha",
      partner: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('leadshare', seed);
    return seed;
  }
  return list;
}
export function listLeadshare(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLeadshare(input, actor = 'system') {
  const row = {
    id: `lea_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    lead: input.lead !== undefined ? input.lead : "Alpha",
    partner: input.partner !== undefined ? input.partner : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('leadshare', row, 300);
  appendAudit({
    actor,
    action: 'leadshare.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLeadshare(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('leadshare', list);
  appendAudit({ actor, action: 'leadshare.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function leadshareSummary() {
  const list = listLeadshare();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, leadshare: list };
}
