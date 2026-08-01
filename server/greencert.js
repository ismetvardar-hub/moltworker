/**
 * AŞAMA 277 — Yeşil Sertifika.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('greencert', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gct_1', name: "Green Key",
      expires: "2027-01-01", status: 'valid', at: new Date().toISOString() }];
    writeCollection('greencert', seed);
    return seed;
  }
  return list;
}
export function listGreencert(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGreencert(input, actor = 'system') {
  const row = {
    id: `gct_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Green Key",
    expires: input.expires !== undefined ? input.expires : "2027-01-01",
    status: input.status || 'valid',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('greencert', row, 300);
  appendAudit({ actor, action: 'greencert.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateGreencert(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('greencert', list);
  appendAudit({ actor, action: 'greencert.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function greencertSummary() {
  const list = listGreencert();
  return { total: list.length, valid: list.filter((x) => x.status === 'valid').length,
    renewing: list.filter((x) => x.status === 'renewing').length,
    expired: list.filter((x) => x.status === 'expired').length, greencert: list };
}
