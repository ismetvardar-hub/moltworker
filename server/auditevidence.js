/**
 * AŞAMA 824 — Audit Evidence.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('auditevidence', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'aud_1', control: "Alpha",
      link: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('auditevidence', seed);
    return seed;
  }
  return list;
}
export function listAuditevidence(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAuditevidence(input, actor = 'system') {
  const row = {
    id: `aud_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    control: input.control !== undefined ? input.control : "Alpha",
    link: input.link !== undefined ? input.link : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('auditevidence', row, 300);
  appendAudit({
    actor,
    action: 'auditevidence.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAuditevidence(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('auditevidence', list);
  appendAudit({ actor, action: 'auditevidence.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function auditevidenceSummary() {
  const list = listAuditevidence();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, auditevidence: list };
}
