/**
 * AŞAMA 815 — Claim Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('claimdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cla_1', claim: "Alpha",
      amount: "5", status: 'planned', at: new Date().toISOString() }];
    writeCollection('claimdesk', seed);
    return seed;
  }
  return list;
}
export function listClaimdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createClaimdesk(input, actor = 'system') {
  const row = {
    id: `cla_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    claim: input.claim !== undefined ? input.claim : "Alpha",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('claimdesk', row, 300);
  appendAudit({
    actor,
    action: 'claimdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateClaimdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('claimdesk', list);
  appendAudit({ actor, action: 'claimdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function claimdeskSummary() {
  const list = listClaimdesk();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, claimdesk: list };
}
