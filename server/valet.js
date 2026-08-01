/**
 * AŞAMA 49 — Vale / otopark fişleri.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

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
  return {
    parked: list.filter((t) => t.status === 'parked').length,
    requested: list.filter((t) => t.status === 'requested').length,
    total: list.length,
  };
}
