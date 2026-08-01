/**
 * AŞAMA 623 — Call Sheet.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('callsheet', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'csh_1', caller: "Guest",
      topic: "Taxi", status: 'open', at: new Date().toISOString() }];
    writeCollection('callsheet', seed);
    return seed;
  }
  return list;
}
export function listCallsheet(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCallsheet(input, actor = 'system') {
  const row = {
    id: `csh_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    caller: input.caller !== undefined ? input.caller : "Guest",
    topic: input.topic !== undefined ? input.topic : "Taxi",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('callsheet', row, 300);
  appendAudit({
    actor,
    action: 'callsheet.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCallsheet(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('callsheet', list);
  appendAudit({ actor, action: 'callsheet.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function callsheetSummary() {
  const list = listCallsheet();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    routed: list.filter((x) => x.status === 'routed').length,
    closed: list.filter((x) => x.status === 'closed').length, callsheet: list };
}
