/**
 * AŞAMA 886 — Story Vault.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('storyvault', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sto_1', story: "Alpha",
      era: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('storyvault', seed);
    return seed;
  }
  return list;
}
export function listStoryvault(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createStoryvault(input, actor = 'system') {
  const row = {
    id: `sto_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    story: input.story !== undefined ? input.story : "Alpha",
    era: input.era !== undefined ? input.era : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('storyvault', row, 300);
  appendAudit({
    actor,
    action: 'storyvault.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateStoryvault(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('storyvault', list);
  appendAudit({ actor, action: 'storyvault.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function storyvaultSummary() {
  const list = listStoryvault();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, storyvault: list };
}
