/**
 * AŞAMA 403 — Moat Watch.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('moatwatch', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mwt_1', moat: "Pass network",
      strength: "8", status: 'strong', at: new Date().toISOString() }];
    writeCollection('moatwatch', seed);
    return seed;
  }
  return list;
}
export function listMoatwatch(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMoatwatch(input, actor = 'system') {
  const row = {
    id: `mwt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    moat: input.moat !== undefined ? input.moat : "Pass network",
    strength: input.strength !== undefined ? Number(input.strength) || 0 : 8,
    status: input.status || 'strong',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('moatwatch', row, 300);
  appendAudit({
    actor,
    action: 'moatwatch.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMoatwatch(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('moatwatch', list);
  appendAudit({ actor, action: 'moatwatch.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function moatwatchSummary() {
  const list = listMoatwatch();
  return { total: list.length, strong: list.filter((x) => x.status === 'strong').length,
    eroding: list.filter((x) => x.status === 'eroding').length,
    weak: list.filter((x) => x.status === 'weak').length, moatwatch: list };
}
