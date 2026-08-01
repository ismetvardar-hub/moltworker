/**
 * AŞAMA 612 — Guest Request.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('guestrequest', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'grq_1', room: "412",
      request: "Extra towels", status: 'open', at: new Date().toISOString() }];
    writeCollection('guestrequest', seed);
    return seed;
  }
  return list;
}
export function listGuestrequest(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGuestrequest(input, actor = 'system') {
  const row = {
    id: `grq_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    request: input.request !== undefined ? input.request : "Extra towels",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('guestrequest', row, 300);
  appendAudit({
    actor,
    action: 'guestrequest.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGuestrequest(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('guestrequest', list);
  appendAudit({ actor, action: 'guestrequest.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function guestrequestSummary() {
  const list = listGuestrequest();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, guestrequest: list };
}
