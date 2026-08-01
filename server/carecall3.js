/**
 * AŞAMA 1121 — Care Call.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('carecall3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'car_1', guestName: "Alpha",
      topic: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('carecall3', seed);
    return seed;
  }
  return list;
}
export function listCarecall3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCarecall3(input, actor = 'system') {
  const row = {
    id: `car_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Alpha",
    topic: input.topic !== undefined ? input.topic : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('carecall3', row, 300);
  appendAudit({
    actor,
    action: 'carecall3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCarecall3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('carecall3', list);
  appendAudit({ actor, action: 'carecall3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function carecall3Summary() {
  const list = listCarecall3();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, carecall3: list };
}
