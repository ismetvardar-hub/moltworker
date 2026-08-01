/**
 * AŞAMA 865 — Cert Renew.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('certrenew', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cer_1', cert: "Alpha",
      expiry: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('certrenew', seed);
    return seed;
  }
  return list;
}
export function listCertrenew(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCertrenew(input, actor = 'system') {
  const row = {
    id: `cer_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    cert: input.cert !== undefined ? input.cert : "Alpha",
    expiry: input.expiry !== undefined ? input.expiry : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('certrenew', row, 300);
  appendAudit({
    actor,
    action: 'certrenew.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCertrenew(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('certrenew', list);
  appendAudit({ actor, action: 'certrenew.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function certrenewSummary() {
  const list = listCertrenew();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, certrenew: list };
}
