/**
 * AŞAMA 58 — Tesis çalışma saatleri.
 */
import { readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

const DEFAULT = [
  {
    venueId: 'venue_olympos_beach',
    name: 'Olympos Beach',
    open: '10:00',
    close: '02:00',
    days: 'Her gün',
    seasonalNote: 'Yaz sezonu',
  },
  {
    venueId: 'venue_kaleici',
    name: 'Kaleiçi',
    open: '11:00',
    close: '23:00',
    days: 'Pzt–Paz',
    seasonalNote: '',
  },
  {
    venueId: 'venue_phaseelis',
    name: 'Phaselis Lounge',
    open: '12:00',
    close: '00:00',
    days: 'Cum–Paz',
    seasonalNote: 'Hafta sonu',
  },
];

function ensure() {
  const list = readCollection('venue-hours', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('venue-hours', DEFAULT);
    return DEFAULT;
  }
  return list;
}

export function listHours() {
  return ensure();
}

export function updateHours(venueId, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((h) => h.venueId === venueId);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, venueId, updatedAt: new Date().toISOString() };
  writeCollection('venue-hours', list);
  appendAudit({
    actor,
    action: 'hours.update',
    detail: `${list[idx].name}: ${list[idx].open}–${list[idx].close}`,
    meta: { venueId },
  });
  return list[idx];
}

export function hoursSummary() {
  return { venues: listHours().length, hours: listHours() };
}
