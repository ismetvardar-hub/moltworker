/**
 * AŞAMA 1072 — Joint Promo.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('jointpromo3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'joi_1', name: "Alpha",
      channel: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('jointpromo3', seed);
    return seed;
  }
  return list;
}
export function listJointpromo3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createJointpromo3(input, actor = 'system') {
  const row = {
    id: `joi_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Alpha",
    channel: input.channel !== undefined ? input.channel : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('jointpromo3', row, 300);
  appendAudit({
    actor,
    action: 'jointpromo3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateJointpromo3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('jointpromo3', list);
  appendAudit({ actor, action: 'jointpromo3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function jointpromo3Summary() {
  const list = listJointpromo3();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, jointpromo3: list };
}
