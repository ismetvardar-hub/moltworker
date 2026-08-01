/**
 * AŞAMA 599 — Lane Control.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('lanecontrol', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lnc_1', gate: "Main",
      mode: "Auto", status: 'open', at: new Date().toISOString() }];
    writeCollection('lanecontrol', seed);
    return seed;
  }
  return list;
}
export function listLanecontrol(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLanecontrol(input, actor = 'system') {
  const row = {
    id: `lnc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    gate: input.gate !== undefined ? input.gate : "Main",
    mode: input.mode !== undefined ? input.mode : "Auto",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lanecontrol', row, 300);
  appendAudit({
    actor,
    action: 'lanecontrol.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLanecontrol(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lanecontrol', list);
  appendAudit({ actor, action: 'lanecontrol.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function lanecontrolSummary() {
  const list = listLanecontrol();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    manual: list.filter((x) => x.status === 'manual').length,
    closed: list.filter((x) => x.status === 'closed').length, lanecontrol: list };
}
