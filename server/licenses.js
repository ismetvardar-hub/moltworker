/**
 * AŞAMA 148 — Ruhsat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('licenses', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lic_1', name: "İçki ruhsatı",
      expires: "2027-01-01", status: 'valid', at: new Date().toISOString() }];
    writeCollection('licenses', seed);
    return seed;
  }
  return list;
}
export function listLicenses(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLicenses(input, actor = 'system') {
  const row = {
    id: `lic_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "İçki ruhsatı",
    expires: input.expires !== undefined ? input.expires : "2027-01-01",
    status: input.status || 'valid',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('licenses', row, 300);
  appendAudit({ actor, action: 'licenses.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateLicenses(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('licenses', list);
  appendAudit({ actor, action: 'licenses.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function licensesSummary() {
  const list = listLicenses();
  return { total: list.length, valid: list.filter((x) => x.status === 'valid').length,
    expiring: list.filter((x) => x.status === 'expiring').length,
    expired: list.filter((x) => x.status === 'expired').length, licenses: list };
}
