/**
 * AŞAMA 909 — Privacy Pol.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('privacypol2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pri_1', policy: "Alpha",
      version: "5", status: 'open', at: new Date().toISOString() }];
    writeCollection('privacypol2', seed);
    return seed;
  }
  return list;
}
export function listPrivacypol2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPrivacypol2(input, actor = 'system') {
  const row = {
    id: `pri_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    policy: input.policy !== undefined ? input.policy : "Alpha",
    version: input.version !== undefined ? Number(input.version) || 0 : 5,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('privacypol2', row, 300);
  appendAudit({
    actor,
    action: 'privacypol2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePrivacypol2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('privacypol2', list);
  appendAudit({ actor, action: 'privacypol2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function privacypol2Summary() {
  const list = listPrivacypol2();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, privacypol2: list };
}
