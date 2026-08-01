/**
 * AŞAMA 593 — Vehicle Maint.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('vehiclemaint', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vmt_1', vehicle: "Van-3",
      task: "Oil", status: 'due', at: new Date().toISOString() }];
    writeCollection('vehiclemaint', seed);
    return seed;
  }
  return list;
}
export function listVehiclemaint(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVehiclemaint(input, actor = 'system') {
  const row = {
    id: `vmt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vehicle: input.vehicle !== undefined ? input.vehicle : "Van-3",
    task: input.task !== undefined ? input.task : "Oil",
    status: input.status || 'due',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('vehiclemaint', row, 300);
  appendAudit({
    actor,
    action: 'vehiclemaint.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateVehiclemaint(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('vehiclemaint', list);
  appendAudit({ actor, action: 'vehiclemaint.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function vehiclemaintSummary() {
  const list = listVehiclemaint();
  return { total: list.length, due: list.filter((x) => x.status === 'due').length,
    in_shop: list.filter((x) => x.status === 'in_shop').length,
    done: list.filter((x) => x.status === 'done').length, vehiclemaint: list };
}
