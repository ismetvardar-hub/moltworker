/**
 * AŞAMA 692 — ID Proof.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('idproof', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'idp_1', guestName: "Alpha",
      method: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('idproof', seed);
    return seed;
  }
  return list;
}
export function listIdproof(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createIdproof(input, actor = 'system') {
  const row = {
    id: `idp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Alpha",
    method: input.method !== undefined ? input.method : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('idproof', row, 300);
  appendAudit({
    actor,
    action: 'idproof.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateIdproof(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('idproof', list);
  appendAudit({ actor, action: 'idproof.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function idproofSummary() {
  const list = listIdproof();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, idproof: list };
}
