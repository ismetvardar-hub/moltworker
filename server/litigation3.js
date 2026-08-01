/**
 * AŞAMA 1177 — Litigation.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('litigation3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lit_1', case: "Alpha",
      status: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('litigation3', seed);
    return seed;
  }
  return list;
}
export function listLitigation3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLitigation3(input, actor = 'system') {
  const row = {
    id: `lit_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    case: input.case !== undefined ? input.case : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('litigation3', row, 300);
  appendAudit({
    actor,
    action: 'litigation3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLitigation3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('litigation3', list);
  appendAudit({ actor, action: 'litigation3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function litigation3Summary() {
  const list = listLitigation3();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, litigation3: list };
}
