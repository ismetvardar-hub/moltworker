/**
 * AŞAMA 971 — Care Call.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('carecall2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'car_1', guestName: "Alpha",
      topic: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('carecall2', seed);
    return seed;
  }
  return list;
}
export function listCarecall2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCarecall2(input, actor = 'system') {
  const row = {
    id: `car_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Alpha",
    topic: input.topic !== undefined ? input.topic : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('carecall2', row, 300);
  appendAudit({
    actor,
    action: 'carecall2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCarecall2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('carecall2', list);
  appendAudit({ actor, action: 'carecall2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function carecall2Summary() {
  const list = listCarecall2();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, carecall2: list };
}
