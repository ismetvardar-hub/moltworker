/**
 * AŞAMA 445 — Atmos Mix.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('atmosmix', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'atm_1', preset: "Night market",
      zone: "Plaza", status: 'draft', at: new Date().toISOString() }];
    writeCollection('atmosmix', seed);
    return seed;
  }
  return list;
}
export function listAtmosmix(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAtmosmix(input, actor = 'system') {
  const row = {
    id: `atm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    preset: input.preset !== undefined ? input.preset : "Night market",
    zone: input.zone !== undefined ? input.zone : "Plaza",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('atmosmix', row, 300);
  appendAudit({
    actor,
    action: 'atmosmix.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAtmosmix(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('atmosmix', list);
  appendAudit({ actor, action: 'atmosmix.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function atmosmixSummary() {
  const list = listAtmosmix();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, atmosmix: list };
}
