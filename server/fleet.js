/**
 * AŞAMA 102 — Araç Filosu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('fleet', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'flt_1',
      plate: "07 LYK 01",
      driver: "Ali",
      status: 'available',
      at: new Date().toISOString(),
    }];
    writeCollection('fleet', seed);
    return seed;
  }
  return list;
}

export function listFleet(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createFleet(input, actor = 'system') {
  const row = {
    id: `flt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    plate: input.plate !== undefined ? input.plate : "07 LYK 01",
    driver: input.driver !== undefined ? input.driver : "Ali",
    status: input.status || 'available',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('fleet', row, 300);
  appendAudit({
    actor,
    action: 'fleet.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateFleet(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('fleet', list);
  appendAudit({ actor, action: 'fleet.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function fleetSummary() {
  const list = listFleet();
  return {
    total: list.length,
    available: list.filter((x) => x.status === 'available').length,
    on_trip: list.filter((x) => x.status === 'on_trip').length,
    service: list.filter((x) => x.status === 'service').length,
    fleet: list,
  };
}
