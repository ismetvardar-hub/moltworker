/**
 * AŞAMA 385 — Table Turn.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tableturn', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tbt_1', section: "Terrace",
      minutes: "68", status: 'ok', at: new Date().toISOString() }];
    writeCollection('tableturn', seed);
    return seed;
  }
  return list;
}
export function listTableturn(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTableturn(input, actor = 'system') {
  const row = {
    id: `tbt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    section: input.section !== undefined ? input.section : "Terrace",
    minutes: input.minutes !== undefined ? Number(input.minutes) || 0 : 68,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tableturn', row, 300);
  appendAudit({
    actor,
    action: 'tableturn.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTableturn(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tableturn', list);
  appendAudit({ actor, action: 'tableturn.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tableturnSummary() {
  const list = listTableturn();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    slow: list.filter((x) => x.status === 'slow').length,
    blocked: list.filter((x) => x.status === 'blocked').length, tableturn: list };
}
