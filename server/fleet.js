/**
 * Wave 174 - Vehicle fleet ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('fleet', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'flt_1',
      plate: "07 LYK 01",
      driver: "Ali",
      status: 'available',
      vehicleType: 'sedan',
      at: new Date().toISOString(),
    }];
    writeCollection('fleet', seed);
    return seed;
  }
  return list;
}

function openFleetFlags() {
  const flags = readCollection('fleet-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addFleetFlag(candidate, actor = 'system') {
  const existing = readCollection('fleet-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('flf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('fleet-flags', list.slice(0, 200));
  return flag;
}

function isServiceDue(row) {
  return row.serviceDue === true || row.status === 'service' || row.maintenanceStatus === 'due';
}

export function listFleet(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createFleet(input = {}, actor = 'system') {
  const row = {
    id: rid('flt'),
    plate: input.plate !== undefined ? input.plate : "07 LYK 01",
    driver: input.driver !== undefined ? input.driver : "Ali",
    vehicleType: input.vehicleType !== undefined ? input.vehicleType : undefined,
    shuttleVan: input.shuttleVan === true || input.vehicleType === 'shuttle_van' || undefined,
    route: input.route !== undefined ? input.route : undefined,
    capacity: input.capacity !== undefined ? Number(input.capacity) || 0 : undefined,
    status: input.status || 'available',
    at: input.at || new Date().toISOString(),
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

export function updateFleet(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.capacity !== undefined) next.capacity = Number(next.capacity) || 0;
  list[idx] = next;
  writeCollection('fleet', list);
  appendAudit({ actor, action: 'fleet.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function fleetSummary() {
  const list = listFleet();
  const serviceDue = list.filter(isServiceDue);
  const shuttleVans = list.filter((x) => x.vehicleType === 'shuttle_van' || x.shuttleVan === true);
  const flags = openFleetFlags();
  return {
    title: 'LIKYA Vehicle Fleet Ops',
    total: list.length,
    available: list.filter((x) => x.status === 'available').length,
    on_trip: list.filter((x) => x.status === 'on_trip').length,
    service: list.filter((x) => x.status === 'service').length,
    serviceDue: serviceDue.length,
    shuttleVans: shuttleVans.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      available: list.filter((x) => x.status === 'available').length,
      on_trip: list.filter((x) => x.status === 'on_trip').length,
      service: list.filter((x) => x.status === 'service').length,
      service_due: serviceDue.length,
      shuttle_vans: shuttleVans.length,
    },
    summaryLines: [
      `Fleet ${list.length} vehicle - service due ${serviceDue.length} - available ${list.filter((x) => x.status === 'available').length}`,
      `On trip ${list.filter((x) => x.status === 'on_trip').length} - shuttle vans ${shuttleVans.length} - flag ${flags.length}`,
    ],
    fleet: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runFleetSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = fleetSummary();
  const created = [];
  const candidates = [];
  if (force || overview.serviceDue > 0) {
    candidates.push({
      key: 'fleet_service_due',
      level: overview.serviceDue > 0 ? 'warn' : 'info',
      text: `Fleet service due ${overview.serviceDue}`,
      domain: 'service',
    });
  }
  if (force || overview.available === 0) {
    candidates.push({
      key: 'fleet_dispatch_capacity',
      level: overview.available === 0 ? 'alert' : 'info',
      text: `Fleet available vehicles ${overview.available}`,
      domain: 'dispatch',
    });
  }
  if (force || overview.shuttleVans === 0) {
    candidates.push({
      key: 'fleet_shuttle_van_seed',
      level: 'info',
      text: `Fleet shuttle vans ${overview.shuttleVans}`,
      domain: 'shuttle',
    });
  }
  for (const candidate of candidates) {
    const flag = addFleetFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `fleet sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('fls'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('fleet-sweeps', sweep, 80);
  appendAudit({ actor, action: 'fleet.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: fleetSummary() };
}

export function ackFleetFlag(input = {}, actor = 'system') {
  const list = readCollection('fleet-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('fleet-flags', list);
  appendAudit({ actor, action: 'fleet.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: fleetSummary() };
}

export function markFleetServiceDue(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.plate && x.plate === input.plate));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isServiceDue(x));
  if (idx < 0) return { ok: false, error: 'Service due yapilacak fleet row yok' };
  list[idx] = {
    ...list[idx],
    status: 'service',
    serviceDue: true,
    maintenanceStatus: 'due',
    serviceReason: input.reason || input.serviceReason || 'scheduled_service',
    serviceDueAt: input.serviceDueAt || new Date().toISOString(),
    serviceDueBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('fleet', list);
  appendAudit({ actor, action: 'fleet.service_due', detail: list[idx].plate || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, vehicle: list[idx], overview: fleetSummary() };
}

export function dispatchFleetVehicle(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.plate && x.plate === input.plate));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'available');
  if (idx < 0) {
    const vehicle = createFleet({
      plate: input.plate || '07 LYK 74',
      driver: input.driver || 'Ops',
      status: 'on_trip',
      route: input.route || 'Lobby-Airport',
      vehicleType: input.vehicleType || 'shuttle_van',
      capacity: input.capacity ?? 8,
    }, actor);
    return { ok: true, vehicle, overview: fleetSummary() };
  }
  list[idx] = {
    ...list[idx],
    status: 'on_trip',
    dispatchRoute: input.route || input.dispatchRoute || list[idx].route || 'Lobby-Airport',
    dispatchedAt: input.dispatchedAt || new Date().toISOString(),
    dispatchedBy: actor,
    serviceDue: false,
    maintenanceStatus: 'ok',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('fleet', list);
  appendAudit({ actor, action: 'fleet.dispatch', detail: list[idx].plate || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, vehicle: list[idx], overview: fleetSummary() };
}

export function seedShuttleVan(input = {}, actor = 'system') {
  const vehicle = createFleet(
    {
      plate: input.plate || '07 SHU 174',
      driver: input.driver || 'Shuttle Ops',
      vehicleType: 'shuttle_van',
      route: input.route || 'Lobby-Beach',
      capacity: input.capacity ?? 8,
      status: input.status || 'available',
    },
    actor,
  );
  appendAudit({ actor, action: 'fleet.seed_shuttle_van', detail: vehicle.plate, meta: { id: vehicle.id } });
  return { ok: true, vehicle, overview: fleetSummary() };
}
