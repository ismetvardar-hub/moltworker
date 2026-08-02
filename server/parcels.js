/**
 * Wave 166 - Parcel and front-desk hold ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const HOUR_MS = 60 * 60_000;
const UNDELIVERED_STATUSES = new Set(['held', 'frontdesk_hold', 'undelivered', 'aging']);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('parcels', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'pcl_1',
      guestName: 'Misafir',
      label: 'Kargo',
      status: 'held',
      holdUntil: new Date(Date.now() + 24 * HOUR_MS).toISOString(),
      at: new Date().toISOString(),
    }];
    writeCollection('parcels', seed);
    return seed;
  }
  return list;
}

function openParcelsFlags() {
  const flags = readCollection('parcels-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addParcelsFlag(candidate, actor = 'system') {
  const existing = readCollection('parcels-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('pcf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('parcels-flags', list.slice(0, 200));
  return flag;
}

function isUndeliveredAging(row) {
  if (row.status === 'aging' || row.status === 'undelivered') return true;
  if (!UNDELIVERED_STATUSES.has(row.status)) return false;
  const holdUntil = Date.parse(row.holdUntil || row.dueAt || row.until || '');
  if (Number.isFinite(holdUntil)) return holdUntil < Date.now();
  const started = Date.parse(row.at || row.createdAt || '');
  const agingHours = Number(row.agingHours || 24);
  return Number.isFinite(started) && started + agingHours * HOUR_MS < Date.now();
}

export function listParcels(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createParcels(input = {}, actor = 'system') {
  const agingHours = Number(input.agingHours ?? 24) || 24;
  const row = {
    id: `pcl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : 'Misafir',
    label: input.label !== undefined ? input.label : 'Kargo',
    location: input.location || 'Front desk',
    trackingNo: input.trackingNo || input.code || null,
    agingHours,
    holdUntil: input.holdUntil || input.dueAt || new Date(Date.now() + agingHours * HOUR_MS).toISOString(),
    status: input.status || 'held',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('parcels', row, 300);
  appendAudit({
    actor,
    action: 'parcels.create',
    detail: String(row.guestName || row.label || row.trackingNo || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateParcels(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.agingHours !== undefined) next.agingHours = Number(next.agingHours) || 0;
  list[idx] = next;
  writeCollection('parcels', list);
  appendAudit({ actor, action: 'parcels.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function parcelsSummary() {
  const list = listParcels();
  const undeliveredAging = list.filter(isUndeliveredAging);
  const frontdeskHolds = list.filter((x) => x.status === 'frontdesk_hold' || x.location === 'Front desk');
  const flags = openParcelsFlags();
  return {
    title: 'LIKYA Parcels Ops',
    total: list.length,
    held: list.filter((x) => x.status === 'held').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    returned: list.filter((x) => x.status === 'returned').length,
    undeliveredAging: undeliveredAging.length,
    frontdeskHolds: frontdeskHolds.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      held: list.filter((x) => x.status === 'held').length,
      delivered: list.filter((x) => x.status === 'delivered').length,
      returned: list.filter((x) => x.status === 'returned').length,
      undelivered_aging: undeliveredAging.length,
      frontdesk_holds: frontdeskHolds.length,
    },
    summaryLines: [
      `Parcels ${list.length} item - held ${list.filter((x) => x.status === 'held').length} - aging ${undeliveredAging.length}`,
      `Delivered ${list.filter((x) => x.status === 'delivered').length} - front desk ${frontdeskHolds.length} - flag ${flags.length}`,
    ],
    parcels: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runParcelsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = parcelsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.undeliveredAging > 0) {
    candidates.push({
      key: 'parcels_undelivered_aging',
      level: overview.undeliveredAging > 0 ? 'warn' : 'info',
      text: `Undelivered aging parcels ${overview.undeliveredAging}`,
      domain: 'undelivered',
    });
  }
  if (force || overview.frontdeskHolds > 0) {
    candidates.push({
      key: 'parcels_frontdesk_holds',
      level: overview.frontdeskHolds > 8 ? 'warn' : 'info',
      text: `Front-desk parcel holds ${overview.frontdeskHolds}`,
      domain: 'frontdesk',
    });
  }
  if (force || overview.held > overview.delivered) {
    candidates.push({
      key: 'parcels_delivery_backlog',
      level: overview.held > overview.delivered ? 'warn' : 'info',
      text: `Held parcels ${overview.held} / delivered ${overview.delivered}`,
      domain: 'delivery',
    });
  }
  for (const candidate of candidates) {
    const flag = addParcelsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `parcels sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('pcs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('parcels-sweeps', sweep, 80);
  appendAudit({ actor, action: 'parcels.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: parcelsSummary() };
}

export function ackParcelsFlag(input = {}, actor = 'system') {
  const list = readCollection('parcels-flags', []) || [];
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
  writeCollection('parcels-flags', list);
  appendAudit({ actor, action: 'parcels.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: parcelsSummary() };
}

export function ageParcelUndelivered(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.trackingNo && x.trackingNo === input.trackingNo));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'held' || x.status === 'frontdesk_hold');
  if (idx < 0) return { ok: false, error: 'Aging yapilacak parcel yok' };
  list[idx] = {
    ...list[idx],
    status: 'aging',
    holdUntil: input.holdUntil || new Date(Date.now() - HOUR_MS).toISOString(),
    agingReason: input.reason || input.agingReason || 'Undelivered front-desk hold aging',
    agedAt: input.agedAt || new Date().toISOString(),
    agedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('parcels', list);
  appendAudit({ actor, action: 'parcels.undelivered_age', detail: list[idx].label || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, parcel: list[idx], overview: parcelsSummary() };
}

export function markParcelDelivered(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.trackingNo && x.trackingNo === input.trackingNo));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'delivered' && x.status !== 'returned');
  if (idx < 0) return { ok: false, error: 'Delivered yapilacak parcel yok' };
  list[idx] = {
    ...list[idx],
    status: 'delivered',
    deliveredAt: input.deliveredAt || new Date().toISOString(),
    deliveredBy: actor,
    deliveredTo: input.deliveredTo || input.guestName || list[idx].guestName,
    deliveryNote: input.note || input.deliveryNote || 'Delivered from front desk',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('parcels', list);
  appendAudit({ actor, action: 'parcels.deliver', detail: list[idx].label || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, parcel: list[idx], overview: parcelsSummary() };
}

export function seedFrontdeskParcelHold(input = {}, actor = 'system') {
  const parcel = createParcels(
    {
      guestName: input.guestName || 'Front desk guest',
      label: input.label || 'Front-desk hold',
      location: 'Front desk',
      trackingNo: input.trackingNo || `FD-${randomBytes(2).toString('hex').toUpperCase()}`,
      status: 'frontdesk_hold',
      agingHours: Number(input.agingHours ?? 12),
      holdUntil: input.holdUntil || new Date(Date.now() - HOUR_MS).toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'parcels.seed_frontdesk_hold', detail: parcel.label, meta: { id: parcel.id } });
  return { ok: true, parcel, overview: parcelsSummary() };
}
