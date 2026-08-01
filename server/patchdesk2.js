/**
 * AŞAMA 913 — Patch Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('patchdesk2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pat_1', asset: "Alpha",
      cve: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('patchdesk2', seed);
    return seed;
  }
  return list;
}
export function listPatchdesk2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPatchdesk2(input, actor = 'system') {
  const row = {
    id: `pat_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Alpha",
    cve: input.cve !== undefined ? input.cve : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('patchdesk2', row, 300);
  appendAudit({
    actor,
    action: 'patchdesk2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePatchdesk2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('patchdesk2', list);
  appendAudit({ actor, action: 'patchdesk2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function patchdesk2Summary() {
  const list = listPatchdesk2();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, patchdesk2: list };
}
