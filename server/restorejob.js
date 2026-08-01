/**
 * AŞAMA 841 — Restore Job.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('restorejob', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'res_1', system: "Alpha",
      eta: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('restorejob', seed);
    return seed;
  }
  return list;
}
export function listRestorejob(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRestorejob(input, actor = 'system') {
  const row = {
    id: `res_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    system: input.system !== undefined ? input.system : "Alpha",
    eta: input.eta !== undefined ? input.eta : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('restorejob', row, 300);
  appendAudit({
    actor,
    action: 'restorejob.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRestorejob(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('restorejob', list);
  appendAudit({ actor, action: 'restorejob.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function restorejobSummary() {
  const list = listRestorejob();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, restorejob: list };
}
