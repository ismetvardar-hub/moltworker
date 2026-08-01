/**
 * AŞAMA 1030 — KYC Row.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('kycrow2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'kyc_1', party: "Alpha",
      level: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('kycrow2', seed);
    return seed;
  }
  return list;
}
export function listKycrow2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createKycrow2(input, actor = 'system') {
  const row = {
    id: `kyc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    party: input.party !== undefined ? input.party : "Alpha",
    level: input.level !== undefined ? input.level : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('kycrow2', row, 300);
  appendAudit({
    actor,
    action: 'kycrow2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateKycrow2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('kycrow2', list);
  appendAudit({ actor, action: 'kycrow2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function kycrow2Summary() {
  const list = listKycrow2();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, kycrow2: list };
}
