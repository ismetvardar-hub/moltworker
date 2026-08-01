/**
 * AŞAMA 368 — Change Window.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('changewindow', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'chw_1', window: "Tue 02:00",
      change: "POS patch", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('changewindow', seed);
    return seed;
  }
  return list;
}
export function listChangewindow(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createChangewindow(input, actor = 'system') {
  const row = {
    id: `chw_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    window: input.window !== undefined ? input.window : "Tue 02:00",
    change: input.change !== undefined ? input.change : "POS patch",
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('changewindow', row, 300);
  appendAudit({
    actor,
    action: 'changewindow.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateChangewindow(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('changewindow', list);
  appendAudit({ actor, action: 'changewindow.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function changewindowSummary() {
  const list = listChangewindow();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    open: list.filter((x) => x.status === 'open').length,
    closed: list.filter((x) => x.status === 'closed').length, changewindow: list };
}
