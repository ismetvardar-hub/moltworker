/**
 * AŞAMA 898 — Vault Final.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('vaultfinal', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vau_1', account: "Alpha",
      balance: "5", status: 'draft', at: new Date().toISOString() }];
    writeCollection('vaultfinal', seed);
    return seed;
  }
  return list;
}
export function listVaultfinal(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVaultfinal(input, actor = 'system') {
  const row = {
    id: `vau_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    account: input.account !== undefined ? input.account : "Alpha",
    balance: input.balance !== undefined ? Number(input.balance) || 0 : 5,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('vaultfinal', row, 300);
  appendAudit({
    actor,
    action: 'vaultfinal.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateVaultfinal(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('vaultfinal', list);
  appendAudit({ actor, action: 'vaultfinal.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function vaultfinalSummary() {
  const list = listVaultfinal();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, vaultfinal: list };
}
