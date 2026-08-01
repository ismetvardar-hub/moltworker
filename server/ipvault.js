/**
 * AŞAMA 811 — IP Vault.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ipvault', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ipv_1', asset: "Alpha",
      owner: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('ipvault', seed);
    return seed;
  }
  return list;
}
export function listIpvault(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIpvault(input, actor = 'system') {
  const row = {
    id: `ipv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ipvault', row, 300);
  appendAudit({
    actor,
    action: 'ipvault.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateIpvault(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ipvault', list);
  appendAudit({ actor, action: 'ipvault.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ipvaultSummary() {
  const list = listIpvault();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, ipvault: list };
}
