/**
 * AŞAMA 1031 — Sanctions.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sanctions2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'san_1', party: "Alpha",
      result: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('sanctions2', seed);
    return seed;
  }
  return list;
}
export function listSanctions2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSanctions2(input, actor = 'system') {
  const row = {
    id: `san_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    party: input.party !== undefined ? input.party : "Alpha",
    result: input.result !== undefined ? input.result : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sanctions2', row, 300);
  appendAudit({
    actor,
    action: 'sanctions2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSanctions2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sanctions2', list);
  appendAudit({ actor, action: 'sanctions2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sanctions2Summary() {
  const list = listSanctions2();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, sanctions2: list };
}
