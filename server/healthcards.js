/**
 * AŞAMA 139 — Sağlık Kartı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('healthcards', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hlc_1', employee: "Mehmet",
      expires: "2026-12-01", status: 'valid', at: new Date().toISOString() }];
    writeCollection('healthcards', seed);
    return seed;
  }
  return list;
}
export function listHealthcards(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHealthcards(input, actor = 'system') {
  const row = {
    id: `hlc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Mehmet",
    expires: input.expires !== undefined ? input.expires : "2026-12-01",
    status: input.status || 'valid',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('healthcards', row, 300);
  appendAudit({ actor, action: 'healthcards.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateHealthcards(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('healthcards', list);
  appendAudit({ actor, action: 'healthcards.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function healthcardsSummary() {
  const list = listHealthcards();
  return { total: list.length, valid: list.filter((x) => x.status === 'valid').length,
    expiring: list.filter((x) => x.status === 'expiring').length,
    expired: list.filter((x) => x.status === 'expired').length, healthcards: list };
}
