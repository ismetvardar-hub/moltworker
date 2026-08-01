/**
 * AŞAMA 522 — Audit Trail+.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('audittrail2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'adt_1', scope: "Kitchen",
      finder: "Gap-2", status: 'open', at: new Date().toISOString() }];
    writeCollection('audittrail2', seed);
    return seed;
  }
  return list;
}
export function listAudittrail2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAudittrail2(input, actor = 'system') {
  const row = {
    id: `adt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    scope: input.scope !== undefined ? input.scope : "Kitchen",
    finder: input.finder !== undefined ? input.finder : "Gap-2",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('audittrail2', row, 300);
  appendAudit({
    actor,
    action: 'audittrail2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAudittrail2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('audittrail2', list);
  appendAudit({ actor, action: 'audittrail2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function audittrail2Summary() {
  const list = listAudittrail2();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    evidence: list.filter((x) => x.status === 'evidence').length,
    closed: list.filter((x) => x.status === 'closed').length, audittrail2: list };
}
