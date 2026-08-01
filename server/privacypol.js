/**
 * AŞAMA 699 — Privacy Pol.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('privacypol', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pri_1', policy: "Alpha",
      version: "5", status: 'open', at: new Date().toISOString() }];
    writeCollection('privacypol', seed);
    return seed;
  }
  return list;
}
export function listPrivacypol(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPrivacypol(input, actor = 'system') {
  const row = {
    id: `pri_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    policy: input.policy !== undefined ? input.policy : "Alpha",
    version: input.version !== undefined ? Number(input.version) || 0 : 5,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('privacypol', row, 300);
  appendAudit({
    actor,
    action: 'privacypol.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePrivacypol(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('privacypol', list);
  appendAudit({ actor, action: 'privacypol.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function privacypolSummary() {
  const list = listPrivacypol();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, privacypol: list };
}
