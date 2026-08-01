/**
 * AŞAMA 336 — Cihaz Envanter.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('devinventory', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dvi_1', device: "Lock-9",
      model: "NEXUS-L", status: 'active', at: new Date().toISOString() }];
    writeCollection('devinventory', seed);
    return seed;
  }
  return list;
}
export function listDevinventory(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDevinventory(input, actor = 'system') {
  const row = {
    id: `dvi_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    device: input.device !== undefined ? input.device : "Lock-9",
    model: input.model !== undefined ? input.model : "NEXUS-L",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('devinventory', row, 300);
  appendAudit({
    actor,
    action: 'devinventory.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDevinventory(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('devinventory', list);
  appendAudit({ actor, action: 'devinventory.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function devinventorySummary() {
  const list = listDevinventory();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    spare: list.filter((x) => x.status === 'spare').length,
    retired: list.filter((x) => x.status === 'retired').length, devinventory: list };
}
