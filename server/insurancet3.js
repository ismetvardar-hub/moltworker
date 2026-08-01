/**
 * AŞAMA 1176 — Insurance T.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('insurancet3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ins_1', policy: "Alpha",
      premium: "5", status: 'pending', at: new Date().toISOString() }];
    writeCollection('insurancet3', seed);
    return seed;
  }
  return list;
}
export function listInsurancet3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInsurancet3(input, actor = 'system') {
  const row = {
    id: `ins_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    policy: input.policy !== undefined ? input.policy : "Alpha",
    premium: input.premium !== undefined ? Number(input.premium) || 0 : 5,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('insurancet3', row, 300);
  appendAudit({
    actor,
    action: 'insurancet3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateInsurancet3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('insurancet3', list);
  appendAudit({ actor, action: 'insurancet3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function insurancet3Summary() {
  const list = listInsurancet3();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, insurancet3: list };
}
