/**
 * AŞAMA 279 — Politika Onay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('policyack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pol_1', policy: "KVKK",
      employee: "Ali", status: 'pending', at: new Date().toISOString() }];
    writeCollection('policyack', seed);
    return seed;
  }
  return list;
}
export function listPolicyack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPolicyack(input, actor = 'system') {
  const row = {
    id: `pol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    policy: input.policy !== undefined ? input.policy : "KVKK",
    employee: input.employee !== undefined ? input.employee : "Ali",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('policyack', row, 300);
  appendAudit({ actor, action: 'policyack.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updatePolicyack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('policyack', list);
  appendAudit({ actor, action: 'policyack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function policyackSummary() {
  const list = listPolicyack();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    acked: list.filter((x) => x.status === 'acked').length, policyack: list };
}
