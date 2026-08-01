/**
 * AŞAMA 62 — Tesis etkinlik takvimi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('events-calendar', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'evt_1',
        title: 'Sunset DJ',
        date: '2026-08-01',
        venueId: 'venue_olympos_beach',
        status: 'planned',
      },
    ];
    writeCollection('events-calendar', seed);
    return seed;
  }
  return list;
}

export function listEventcal(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createEventcal(input, actor = 'system') {
  const row = {
    id: `evt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: String(input.title || '').trim() || 'Etkinlik',
    date: input.date || new Date().toISOString().slice(0, 10),
    venueId: input.venueId || 'venue_olympos_beach',
    status: input.status || 'planned',
    note: input.note || '',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('events-calendar', row, 300);
  appendAudit({
    actor,
    action: 'eventcal.create',
    detail: row.title,
    meta: { id: row.id },
  });
  return row;
}

export function updateEventcal(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('events-calendar', list);
  appendAudit({
    actor,
    action: 'eventcal.update',
    detail: `${list[idx].title} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function eventcalSummary() {
  const list = listEventcal();
  return {
    total: list.length,
    planned: list.filter((x) => x.status === 'planned').length,
    live: list.filter((x) => x.status === 'live').length,
    done: list.filter((x) => x.status === 'done').length,
    events: list,
  };
}
