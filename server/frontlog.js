/**
 * AŞAMA 627 — Front Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('frontlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'frl_1', shift: "Evening",
      note: "Soft opening", status: 'draft', at: new Date().toISOString() }];
    writeCollection('frontlog', seed);
    return seed;
  }
  return list;
}
export function listFrontlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFrontlog(input, actor = 'system') {
  const row = {
    id: `frl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    shift: input.shift !== undefined ? input.shift : "Evening",
    note: input.note !== undefined ? input.note : "Soft opening",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('frontlog', row, 300);
  appendAudit({
    actor,
    action: 'frontlog.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFrontlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('frontlog', list);
  appendAudit({ actor, action: 'frontlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function frontlogSummary() {
  const list = listFrontlog();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    posted: list.filter((x) => x.status === 'posted').length,
    archived: list.filter((x) => x.status === 'archived').length, frontlog: list };
}
