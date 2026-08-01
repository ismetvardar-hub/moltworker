/**
 * AŞAMA 1034 — Audit Evidence.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('auditevidence2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'aud_1', control: "Alpha",
      link: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('auditevidence2', seed);
    return seed;
  }
  return list;
}
export function listAuditevidence2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAuditevidence2(input, actor = 'system') {
  const row = {
    id: `aud_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    control: input.control !== undefined ? input.control : "Alpha",
    link: input.link !== undefined ? input.link : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('auditevidence2', row, 300);
  appendAudit({
    actor,
    action: 'auditevidence2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAuditevidence2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('auditevidence2', list);
  appendAudit({ actor, action: 'auditevidence2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function auditevidence2Summary() {
  const list = listAuditevidence2();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, auditevidence2: list };
}
