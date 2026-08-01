/**
 * AŞAMA 356 — Recovery Path.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('recoverypath', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rcp_1', caseId: "RC-01",
      path: "Comp+apology", status: 'open', at: new Date().toISOString() }];
    writeCollection('recoverypath', seed);
    return seed;
  }
  return list;
}
export function listRecoverypath(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRecoverypath(input, actor = 'system') {
  const row = {
    id: `rcp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    caseId: input.caseId !== undefined ? input.caseId : "RC-01",
    path: input.path !== undefined ? input.path : "Comp+apology",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('recoverypath', row, 300);
  appendAudit({
    actor,
    action: 'recoverypath.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRecoverypath(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('recoverypath', list);
  appendAudit({ actor, action: 'recoverypath.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function recoverypathSummary() {
  const list = listRecoverypath();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    running: list.filter((x) => x.status === 'running').length,
    closed: list.filter((x) => x.status === 'closed').length, recoverypath: list };
}
