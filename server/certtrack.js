/**
 * AŞAMA 499 — Cert Track.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('certtrack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'crt_1', person: "Can",
      cert: "First aid", status: 'valid', at: new Date().toISOString() }];
    writeCollection('certtrack', seed);
    return seed;
  }
  return list;
}
export function listCerttrack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCerttrack(input, actor = 'system') {
  const row = {
    id: `crt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    person: input.person !== undefined ? input.person : "Can",
    cert: input.cert !== undefined ? input.cert : "First aid",
    status: input.status || 'valid',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('certtrack', row, 300);
  appendAudit({
    actor,
    action: 'certtrack.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCerttrack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('certtrack', list);
  appendAudit({ actor, action: 'certtrack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function certtrackSummary() {
  const list = listCerttrack();
  return { total: list.length, valid: list.filter((x) => x.status === 'valid').length,
    expiring: list.filter((x) => x.status === 'expiring').length,
    expired: list.filter((x) => x.status === 'expired').length, certtrack: list };
}
