/**
 * AŞAMA 993 — Circle.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('circle2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cir_1', circle: "Alpha",
      members: "5", status: 'idle', at: new Date().toISOString() }];
    writeCollection('circle2', seed);
    return seed;
  }
  return list;
}
export function listCircle2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCircle2(input, actor = 'system') {
  const row = {
    id: `cir_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    circle: input.circle !== undefined ? input.circle : "Alpha",
    members: input.members !== undefined ? Number(input.members) || 0 : 5,
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('circle2', row, 300);
  appendAudit({
    actor,
    action: 'circle2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCircle2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('circle2', list);
  appendAudit({ actor, action: 'circle2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function circle2Summary() {
  const list = listCircle2();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, circle2: list };
}
