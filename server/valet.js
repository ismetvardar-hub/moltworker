/**
 * AŞAMA 49 — Vale / otopark fişleri.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function minutesOld(iso) {
  const t = Date.parse(iso || 0);
  if (!Number.isFinite(t)) return 0;
  return (Date.now() - t) / 60000;
}

function missingPlate(ticket) {
  const plate = String(ticket.plate || '').trim().toUpperCase();
  return !plate || plate === 'PLAKA' || plate === 'UNKNOWN';
}

function ensure() {
  const list = readCollection('valet-tickets', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'val_1',
        plate: '07 LYK 01',
        guestName: 'Elena K.',
        venueId: 'venue_olympos_beach',
        spot: 'V-12',
        status: 'parked',
        at: new Date(Date.now() - 5400_000).toISOString(),
      },
    ];
    writeCollection('valet-tickets', seed);
    return seed;
  }
  return list;
}

export function listValet(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((t) => t.status === filter.status);
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function createValet(input, actor = 'system') {
  const ticket = {
    id: `val_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    plate: String(input.plate || '').trim().toUpperCase() || 'PLAKA',
    guestName: input.guestName || 'Misafir',
    venueId: input.venueId || 'venue_olympos_beach',
    spot: input.spot || '',
    status: 'parked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('valet-tickets', ticket, 300);
  appendAudit({
    actor,
    action: 'valet.create',
    detail: `${ticket.plate} · ${ticket.spot || 'spot yok'}`,
    meta: { id: ticket.id },
  });
  return ticket;
}

export function updateValet(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('valet-tickets', list);
  appendAudit({
    actor,
    action: 'valet.update',
    detail: `${list[idx].plate} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function valetSummary() {
  const list = listValet();
  const flags = readCollection('valet-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const parkedTooLong = list.filter((t) => t.status === 'parked' && minutesOld(t.at || t.createdAt) >= 240);
  const ticketWithoutPlate = list.filter(missingPlate);
  const readyForPickupAging = list.filter(
    (t) => (t.status === 'requested' || t.status === 'ready') && minutesOld(t.requestedAt || t.readyAt || t.updatedAt || t.at) >= 15,
  );
  return {
    title: 'LİKYA Vale Ops',
    parked: list.filter((t) => t.status === 'parked').length,
    requested: list.filter((t) => t.status === 'requested').length,
    parkedTooLong: parkedTooLong.length,
    ticketWithoutPlate: ticketWithoutPlate.length,
    readyForPickupAging: readyForPickupAging.length,
    total: list.length,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      parked: list.filter((t) => t.status === 'parked').length,
      requested: list.filter((t) => t.status === 'requested').length,
      parked_too_long: parkedTooLong.length,
      ticket_without_plate: ticketWithoutPlate.length,
      ready_for_pickup_aging: readyForPickupAging.length,
      total: list.length,
    },
    summaryLines: [
      `Vale ${list.length} · parked ${list.filter((t) => t.status === 'parked').length} · requested ${list.filter((t) => t.status === 'requested').length}`,
      `Uzun park ${parkedTooLong.length} · plakasız ${ticketWithoutPlate.length} · pickup aging ${readyForPickupAging.length}`,
    ],
  };
}

export function runValetSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = valetSummary();
  const existing = readCollection('valet-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.parkedTooLong || 0) > 0) {
    candidates.push({
      key: 'valet_parked_too_long',
      level: (overview.parkedTooLong || 0) > 0 ? 'warn' : 'info',
      text: `Uzun süre parked vale fişi ${overview.parkedTooLong || 0}`,
      domain: 'parking',
    });
  }
  if (force || (overview.ticketWithoutPlate || 0) > 0) {
    candidates.push({
      key: 'valet_ticket_without_plate',
      level: (overview.ticketWithoutPlate || 0) > 0 ? 'alert' : 'info',
      text: `Plakasız vale fişi ${overview.ticketWithoutPlate || 0}`,
      domain: 'ticket',
    });
  }
  if (force || (overview.readyForPickupAging || 0) > 0) {
    candidates.push({
      key: 'valet_ready_for_pickup_aging',
      level: (overview.readyForPickupAging || 0) > 0 ? 'warn' : 'info',
      text: `Pickup hazır bekleyen vale fişi ${overview.readyForPickupAging || 0}`,
      domain: 'pickup',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('valf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('valet-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'NEXUS',
        title: `valet sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('vals'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('valet-sweeps', sweep, 80);
  appendAudit({ actor, action: 'valet.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: valetSummary() };
}

export function ackValetFlag(input = {}, actor = 'system') {
  const list = readCollection('valet-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('valet-flags', list);
  appendAudit({ actor, action: 'valet.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: valetSummary() };
}

/** Mutator 1 — request/ready a parked vehicle for pickup. */
export function requestValetPickup(input = {}, actor = 'system') {
  let row = null;
  if (input.id || input.ticketId) row = ensure().find((t) => t.id === (input.id || input.ticketId));
  if (!row) row = listValet().find((t) => t.status === 'parked') || listValet()[0];
  if (!row && input.seed !== false) row = seedLongParkedValetTicket({}, actor).ticket;
  if (!row) return { ok: false, error: 'Vale fişi bulunamadı' };
  const requestedAt = input.minutes
    ? new Date(Date.now() - Number(input.minutes) * 60000).toISOString()
    : new Date().toISOString();
  const ticket = updateValet(
    row.id,
    {
      status: input.status || 'requested',
      requestedAt,
      pickupBay: input.pickupBay || row.pickupBay || 'front',
    },
    actor,
  );
  appendAudit({ actor, action: 'valet.pickup_request', detail: ticket?.plate || row.plate, meta: { id: row.id } });
  return { ok: true, ticket, requested: ticket ? [ticket.id] : [], overview: valetSummary() };
}

/** Mutator 2 — complete handoff and deliver a requested vehicle. */
export function deliverValetVehicle(input = {}, actor = 'system') {
  let row = null;
  if (input.id || input.ticketId) row = ensure().find((t) => t.id === (input.id || input.ticketId));
  if (!row) row = listValet().find((t) => t.status === 'requested' || t.status === 'ready') || listValet().find((t) => t.status === 'parked');
  if (!row && input.seed !== false) row = requestValetPickup({}, actor).ticket;
  if (!row) return { ok: false, error: 'Vale fişi bulunamadı' };
  const ticket = updateValet(
    row.id,
    {
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      deliveredBy: actor,
      handoffNote: input.note || 'ops delivered',
    },
    actor,
  );
  appendAudit({ actor, action: 'valet.deliver', detail: ticket?.plate || row.plate, meta: { id: row.id } });
  return { ok: true, ticket, delivered: ticket ? [ticket.id] : [], overview: valetSummary() };
}

/** Mutator 3 — seed a long-parked real valet ticket for drills. */
export function seedLongParkedValetTicket(input = {}, actor = 'system') {
  const ticket = createValet(
    {
      plate: input.plate || '07 OPS 158',
      guestName: input.guestName || 'Long Park Seed',
      venueId: input.venueId || 'venue_olympos_beach',
      spot: input.spot || 'V-OPS',
    },
    actor,
  );
  const list = ensure();
  const idx = list.findIndex((t) => t.id === ticket.id);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      plate: input.missingPlate ? '' : list[idx].plate,
      at: new Date(Date.now() - (Number(input.minutes) || 300) * 60000).toISOString(),
    };
    writeCollection('valet-tickets', list);
  }
  appendAudit({ actor, action: 'valet.seed_long_parked', detail: ticket.plate, meta: { id: ticket.id } });
  return { ok: true, ticket: ensure().find((t) => t.id === ticket.id) || ticket, overview: valetSummary() };
}
