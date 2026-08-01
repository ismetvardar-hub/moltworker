/**
 * AŞAMA 912 — SOC Queue.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('socqueue2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'soc_1', alert: "Alpha",
      owner: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('socqueue2', seed);
    return seed;
  }
  return list;
}
export function listSocqueue2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSocqueue2(input, actor = 'system') {
  const row = {
    id: `soc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    alert: input.alert !== undefined ? input.alert : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('socqueue2', row, 300);
  appendAudit({
    actor,
    action: 'socqueue2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSocqueue2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('socqueue2', list);
  appendAudit({ actor, action: 'socqueue2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function socqueue2Summary() {
  const list = listSocqueue2();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, socqueue2: list };
}
