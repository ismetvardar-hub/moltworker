/**
 * AŞAMA 259 — Sertifika.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('certifications', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'crt_1', employee: "Ayşe",
      cert: "Hijyen", status: 'valid', at: new Date().toISOString() }];
    writeCollection('certifications', seed);
    return seed;
  }
  return list;
}
export function listCertifications(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCertifications(input, actor = 'system') {
  const row = {
    id: `crt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Ayşe",
    cert: input.cert !== undefined ? input.cert : "Hijyen",
    status: input.status || 'valid',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('certifications', row, 300);
  appendAudit({ actor, action: 'certifications.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateCertifications(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('certifications', list);
  appendAudit({ actor, action: 'certifications.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function certificationsSummary() {
  const list = listCertifications();
  return { total: list.length, valid: list.filter((x) => x.status === 'valid').length,
    expiring: list.filter((x) => x.status === 'expiring').length,
    expired: list.filter((x) => x.status === 'expired').length, certifications: list };
}
