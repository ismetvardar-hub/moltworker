/**
 * AŞAMA 10 — Çoklu tesis (venue) yönetimi.
 */

import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const DEFAULT_VENUES = [
  {
    id: 'venue_olympos_beach',
    name: 'Olympos Beach Club',
    city: 'Antalya',
    region: 'Kumluca / Olympos',
    timezone: 'Europe/Istanbul',
    status: 'active',
    gates: ['gate-main', 'gate-beach'],
    notes: 'Ana plaj ve turnike hattı',
  },
  {
    id: 'venue_kaleici',
    name: 'Kaleiçi Lounge',
    city: 'Antalya',
    region: 'Muratpaşa',
    timezone: 'Europe/Istanbul',
    status: 'active',
    gates: ['gate-vip'],
    notes: 'VIP geçiş ve Daze Chef mutfak ekranı',
  },
  {
    id: 'venue_phaseelis',
    name: 'Phaselis Pop-up',
    city: 'Antalya',
    region: 'Kemer',
    timezone: 'Europe/Istanbul',
    status: 'seasonal',
    gates: [],
    notes: 'Sezonluk pop-up operasyon',
  },
];

function ensureSeed() {
  const list = readCollection('venues', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('venues', DEFAULT_VENUES);
    return DEFAULT_VENUES;
  }
  return list;
}

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function openVenueFlags() {
  const flags = readCollection('venues-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addVenueFlag(candidate, actor = 'system') {
  const existing = readCollection('venues-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('venf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('venues-flags', list.slice(0, 200));
  return flag;
}

function isInactiveVenue(venue) {
  return venue.status === 'inactive' || venue.status === 'disabled' || venue.inactiveAt;
}

function isSeasonalDrift(venue) {
  if (venue.status !== 'seasonal') return false;
  const end = Date.parse(venue.seasonEndsAt || venue.seasonEnd || '');
  return !Number.isFinite(end) || end < Date.now();
}

export function listVenues() {
  return ensureSeed();
}

export function getVenue(id) {
  return listVenues().find((v) => v.id === id) ?? null;
}

export function createVenue(input, actor = 'system') {
  const venue = {
    id: input.id || `venue_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: String(input.name || '').trim() || 'İsimsiz Tesis',
    city: input.city || 'Antalya',
    region: input.region || '',
    timezone: input.timezone || 'Europe/Istanbul',
    status: input.status || 'active',
    gates: Array.isArray(input.gates) ? input.gates : [],
    notes: input.notes || '',
    createdAt: new Date().toISOString(),
  };
  prependItem('venues', venue, 100);
  appendAudit({
    actor,
    action: 'venues.create',
    detail: venue.name,
    meta: { id: venue.id },
  });
  return venue;
}

export function updateVenue(id, patch, actor = 'system') {
  const venues = listVenues();
  const idx = venues.findIndex((v) => v.id === id);
  if (idx < 0) return null;
  venues[idx] = {
    ...venues[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('venues', venues);
  appendAudit({
    actor,
    action: 'venues.update',
    detail: venues[idx].name,
    meta: { id },
  });
  return venues[idx];
}

export function removeVenue(id, actor = 'system') {
  const v = getVenue(id);
  if (!v) return null;
  deleteItem('venues', id);
  appendAudit({
    actor,
    action: 'venues.delete',
    detail: v.name,
    meta: { id },
  });
  return v;
}

export function venuesSummary() {
  const venues = listVenues();
  const inactive = venues.filter(isInactiveVenue);
  const seasonalDrift = venues.filter(isSeasonalDrift);
  const flags = openVenueFlags();
  return {
    title: 'LIKYA Venue Ops',
    total: venues.length,
    active: venues.filter((v) => v.status === 'active').length,
    seasonal: venues.filter((v) => v.status === 'seasonal').length,
    inactive: inactive.length,
    seasonalDrift: seasonalDrift.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: venues.length,
      active: venues.filter((v) => v.status === 'active').length,
      seasonal: venues.filter((v) => v.status === 'seasonal').length,
      inactive: inactive.length,
      seasonal_drift: seasonalDrift.length,
    },
    summaryLines: [
      `Venues ${venues.length} total - active ${venues.filter((v) => v.status === 'active').length} - inactive ${inactive.length}`,
      `Seasonal ${venues.filter((v) => v.status === 'seasonal').length} - drift ${seasonalDrift.length} - flag ${flags.length}`,
    ],
    venues,
  };
}

export function runVenuesSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = venuesSummary();
  const created = [];
  const candidates = [];
  if (force || overview.inactive > 0) {
    candidates.push({
      key: 'venues_inactive_venue',
      level: overview.inactive > 0 ? 'warn' : 'info',
      text: `Inactive venues ${overview.inactive}`,
      domain: 'venue',
    });
  }
  if (force || overview.seasonalDrift > 0) {
    candidates.push({
      key: 'venues_seasonal_drift',
      level: overview.seasonalDrift > 0 ? 'warn' : 'info',
      text: `Seasonal venue drift ${overview.seasonalDrift}`,
      domain: 'seasonal',
    });
  }
  for (const candidate of candidates) {
    const flag = addVenueFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'NEXUS',
      title: `venues sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('vens'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('venues-sweeps', sweep, 80);
  appendAudit({ actor, action: 'venues.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: venuesSummary() };
}

export function ackVenuesFlag(input = {}, actor = 'system') {
  const list = readCollection('venues-flags', []) || [];
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
  writeCollection('venues-flags', list);
  appendAudit({ actor, action: 'venues.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: venuesSummary() };
}

export function markVenueInactive(input = {}, actor = 'system') {
  const venues = listVenues();
  const explicitIdx = venues.findIndex((v) => v.id === input.id || (input.name && v.name === input.name));
  const idx = explicitIdx >= 0 ? explicitIdx : venues.findIndex((v) => v.status === 'active' || v.status === 'seasonal');
  if (idx < 0) return { ok: false, error: 'Inactive yapilacak venue yok' };
  venues[idx] = {
    ...venues[idx],
    status: 'inactive',
    inactiveAt: input.inactiveAt || new Date().toISOString(),
    inactiveReason: input.reason || venues[idx].inactiveReason || 'Ops inactive sweep',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('venues', venues);
  appendAudit({ actor, action: 'venues.inactive', detail: venues[idx].name, meta: { id: venues[idx].id } });
  return { ok: true, venue: venues[idx], overview: venuesSummary() };
}

export function activateVenue(input = {}, actor = 'system') {
  const venues = listVenues();
  const explicitIdx = venues.findIndex((v) => v.id === input.id || (input.name && v.name === input.name));
  const idx = explicitIdx >= 0 ? explicitIdx : venues.findIndex((v) => v.status !== 'active');
  if (idx < 0) return { ok: false, error: 'Aktive edilecek venue yok' };
  venues[idx] = {
    ...venues[idx],
    status: 'active',
    inactiveAt: null,
    activatedAt: input.activatedAt || new Date().toISOString(),
    activatedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('venues', venues);
  appendAudit({ actor, action: 'venues.activate', detail: venues[idx].name, meta: { id: venues[idx].id } });
  return { ok: true, venue: venues[idx], overview: venuesSummary() };
}

export function seedSeasonalVenue(input = {}, actor = 'system') {
  const venue = createVenue(
    {
      name: input.name || 'Seasonal pop-up',
      city: input.city || 'Antalya',
      region: input.region || 'Seasonal',
      timezone: input.timezone || 'Europe/Istanbul',
      status: 'seasonal',
      gates: Array.isArray(input.gates) ? input.gates : [],
      notes: input.notes || 'Seasonal venue seed',
    },
    actor,
  );
  const patched = updateVenue(
    venue.id,
    {
      seasonal: true,
      seasonStartsAt: input.seasonStartsAt || new Date().toISOString(),
      seasonEndsAt: input.seasonEndsAt || new Date(Date.now() + 90 * 24 * 60 * 60_000).toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'venues.seed_seasonal', detail: venue.name, meta: { id: venue.id } });
  return { ok: true, venue: patched || venue, overview: venuesSummary() };
}
