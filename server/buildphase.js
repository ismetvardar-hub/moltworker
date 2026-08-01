/**
 * AŞAMA 850 — Build Phase.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('buildphase', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bui_1', phase: "Alpha",
      pct: "5", status: 'pending', at: new Date().toISOString() }];
    writeCollection('buildphase', seed);
    return seed;
  }
  return list;
}
export function listBuildphase(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBuildphase(input, actor = 'system') {
  const row = {
    id: `bui_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    phase: input.phase !== undefined ? input.phase : "Alpha",
    pct: input.pct !== undefined ? Number(input.pct) || 0 : 5,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('buildphase', row, 300);
  appendAudit({
    actor,
    action: 'buildphase.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBuildphase(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('buildphase', list);
  appendAudit({ actor, action: 'buildphase.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function buildphaseSummary() {
  const list = listBuildphase();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, buildphase: list };
}
