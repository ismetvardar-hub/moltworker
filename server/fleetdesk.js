/**
 * AŞAMA 587 — Fleet Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('fleetdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fld_1', vehicle: "Van-3",
      plate: "07 LYK 03", status: 'ready', at: new Date().toISOString() }];
    writeCollection('fleetdesk', seed);
    return seed;
  }
  return list;
}
export function listFleetdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFleetdesk(input, actor = 'system') {
  const row = {
    id: `fld_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vehicle: input.vehicle !== undefined ? input.vehicle : "Van-3",
    plate: input.plate !== undefined ? input.plate : "07 LYK 03",
    status: input.status || 'ready',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('fleetdesk', row, 300);
  appendAudit({
    actor,
    action: 'fleetdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFleetdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('fleetdesk', list);
  appendAudit({ actor, action: 'fleetdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function fleetdeskSummary() {
  const list = listFleetdesk();
  return { total: list.length, ready: list.filter((x) => x.status === 'ready').length,
    assigned: list.filter((x) => x.status === 'assigned').length,
    service: list.filter((x) => x.status === 'service').length, fleetdesk: list };
}
