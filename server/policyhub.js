/**
 * AŞAMA 814 — Policy Hub.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('policyhub', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pol_1', policy: "Alpha",
      version: "5", status: 'ok', at: new Date().toISOString() }];
    writeCollection('policyhub', seed);
    return seed;
  }
  return list;
}
export function listPolicyhub(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPolicyhub(input, actor = 'system') {
  const row = {
    id: `pol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    policy: input.policy !== undefined ? input.policy : "Alpha",
    version: input.version !== undefined ? Number(input.version) || 0 : 5,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('policyhub', row, 300);
  appendAudit({
    actor,
    action: 'policyhub.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePolicyhub(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('policyhub', list);
  appendAudit({ actor, action: 'policyhub.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function policyhubSummary() {
  const list = listPolicyhub();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, policyhub: list };
}
