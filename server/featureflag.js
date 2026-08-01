/**
 * AŞAMA 527 — Feature Flag.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('featureflag', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ffg_1', flag: "aurora_v2",
      pct: "25", status: 'off', at: new Date().toISOString() }];
    writeCollection('featureflag', seed);
    return seed;
  }
  return list;
}
export function listFeatureflag(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFeatureflag(input, actor = 'system') {
  const row = {
    id: `ffg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    flag: input.flag !== undefined ? input.flag : "aurora_v2",
    pct: input.pct !== undefined ? Number(input.pct) || 0 : 25,
    status: input.status || 'off',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('featureflag', row, 300);
  appendAudit({
    actor,
    action: 'featureflag.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFeatureflag(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('featureflag', list);
  appendAudit({ actor, action: 'featureflag.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function featureflagSummary() {
  const list = listFeatureflag();
  return { total: list.length, off: list.filter((x) => x.status === 'off').length,
    canary: list.filter((x) => x.status === 'canary').length,
    on: list.filter((x) => x.status === 'on').length, featureflag: list };
}
