/**
 * AŞAMA 1025 — Claim Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('claimdesk2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cla_1', claim: "Alpha",
      amount: "5", status: 'planned', at: new Date().toISOString() }];
    writeCollection('claimdesk2', seed);
    return seed;
  }
  return list;
}
export function listClaimdesk2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createClaimdesk2(input, actor = 'system') {
  const row = {
    id: `cla_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    claim: input.claim !== undefined ? input.claim : "Alpha",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('claimdesk2', row, 300);
  appendAudit({
    actor,
    action: 'claimdesk2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateClaimdesk2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('claimdesk2', list);
  appendAudit({ actor, action: 'claimdesk2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function claimdesk2Summary() {
  const list = listClaimdesk2();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, claimdesk2: list };
}
