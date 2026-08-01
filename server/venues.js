/**
 * AŞAMA 10 — Çoklu tesis (venue) yönetimi.
 */

import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem, deleteItem } from './store.js';
import { appendAudit } from './audit.js';

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
  return {
    total: venues.length,
    active: venues.filter((v) => v.status === 'active').length,
    seasonal: venues.filter((v) => v.status === 'seasonal').length,
    venues,
  };
}
