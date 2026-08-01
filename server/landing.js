/**
 * AŞAMA 561 — Landing.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('landing', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lnd_1', page: "/summer",
      variant: "A", status: 'draft', at: new Date().toISOString() }];
    writeCollection('landing', seed);
    return seed;
  }
  return list;
}
export function listLanding(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLanding(input, actor = 'system') {
  const row = {
    id: `lnd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    page: input.page !== undefined ? input.page : "/summer",
    variant: input.variant !== undefined ? input.variant : "A",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('landing', row, 300);
  appendAudit({
    actor,
    action: 'landing.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLanding(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('landing', list);
  appendAudit({ actor, action: 'landing.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function landingSummary() {
  const list = listLanding();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    retired: list.filter((x) => x.status === 'retired').length, landing: list };
}
