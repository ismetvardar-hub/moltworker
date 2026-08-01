/**
 * AŞAMA 922 — Joint Promo.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('jointpromo2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'joi_1', name: "Alpha",
      channel: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('jointpromo2', seed);
    return seed;
  }
  return list;
}
export function listJointpromo2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createJointpromo2(input, actor = 'system') {
  const row = {
    id: `joi_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Alpha",
    channel: input.channel !== undefined ? input.channel : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('jointpromo2', row, 300);
  appendAudit({
    actor,
    action: 'jointpromo2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateJointpromo2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('jointpromo2', list);
  appendAudit({ actor, action: 'jointpromo2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function jointpromo2Summary() {
  const list = listJointpromo2();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, jointpromo2: list };
}
