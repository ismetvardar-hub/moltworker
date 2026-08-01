/**
 * AŞAMA 519 — Lockout Tag.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('lockouttag', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'loto_1', asset: "Pump-3",
      owner: "Tech", status: 'applied', at: new Date().toISOString() }];
    writeCollection('lockouttag', seed);
    return seed;
  }
  return list;
}
export function listLockouttag(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLockouttag(input, actor = 'system') {
  const row = {
    id: `loto_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Pump-3",
    owner: input.owner !== undefined ? input.owner : "Tech",
    status: input.status || 'applied',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lockouttag', row, 300);
  appendAudit({
    actor,
    action: 'lockouttag.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLockouttag(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lockouttag', list);
  appendAudit({ actor, action: 'lockouttag.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function lockouttagSummary() {
  const list = listLockouttag();
  return { total: list.length, applied: list.filter((x) => x.status === 'applied').length,
    work: list.filter((x) => x.status === 'work').length,
    removed: list.filter((x) => x.status === 'removed').length, lockouttag: list };
}
