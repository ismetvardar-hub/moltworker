/**
 * AŞAMA 608 — Deep Clean.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('deepclean', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dpc_1', room: "220",
      cycle: "30d", status: 'due', at: new Date().toISOString() }];
    writeCollection('deepclean', seed);
    return seed;
  }
  return list;
}
export function listDeepclean(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDeepclean(input, actor = 'system') {
  const row = {
    id: `dpc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "220",
    cycle: input.cycle !== undefined ? input.cycle : "30d",
    status: input.status || 'due',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('deepclean', row, 300);
  appendAudit({
    actor,
    action: 'deepclean.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDeepclean(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('deepclean', list);
  appendAudit({ actor, action: 'deepclean.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function deepcleanSummary() {
  const list = listDeepclean();
  return { total: list.length, due: list.filter((x) => x.status === 'due').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, deepclean: list };
}
