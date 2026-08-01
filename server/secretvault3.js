/**
 * AŞAMA 1056 — Secret Vault.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('secretvault3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sec_1', name: "Alpha",
      scope: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('secretvault3', seed);
    return seed;
  }
  return list;
}
export function listSecretvault3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSecretvault3(input, actor = 'system') {
  const row = {
    id: `sec_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Alpha",
    scope: input.scope !== undefined ? input.scope : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('secretvault3', row, 300);
  appendAudit({
    actor,
    action: 'secretvault3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSecretvault3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('secretvault3', list);
  appendAudit({ actor, action: 'secretvault3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function secretvault3Summary() {
  const list = listSecretvault3();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, secretvault3: list };
}
