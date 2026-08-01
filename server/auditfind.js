/**
 * AŞAMA 278 — Denetim Bulgu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('auditfind', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'afd_1', finding: "Stok farkı",
      severity: "medium", status: 'open', at: new Date().toISOString() }];
    writeCollection('auditfind', seed);
    return seed;
  }
  return list;
}
export function listAuditfind(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAuditfind(input, actor = 'system') {
  const row = {
    id: `afd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    finding: input.finding !== undefined ? input.finding : "Stok farkı",
    severity: input.severity !== undefined ? input.severity : "medium",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('auditfind', row, 300);
  appendAudit({ actor, action: 'auditfind.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateAuditfind(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('auditfind', list);
  appendAudit({ actor, action: 'auditfind.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function auditfindSummary() {
  const list = listAuditfind();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    mitigated: list.filter((x) => x.status === 'mitigated').length,
    closed: list.filter((x) => x.status === 'closed').length, auditfind: list };
}
