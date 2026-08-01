/**
 * AŞAMA 35 — Kayıp eşya defteri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensureSeed() {
  let list = readCollection('lost-found', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'lf_1',
        item: 'Siyah güneş gözlüğü',
        venueId: 'venue_olympos_beach',
        location: 'Sahil şezlong 14',
        status: 'stored',
        foundBy: 'Selin M.',
        claimant: null,
        note: 'Marka Ray-Ban benzeri',
        at: new Date(Date.now() - 7200_000).toISOString(),
      },
    ];
    writeCollection('lost-found', list);
  }
  return list;
}

export function listLostFound(filter = {}) {
  let list = ensureSeed();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  if (filter.venueId) list = list.filter((x) => x.venueId === filter.venueId);
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function createLostFound(input, actor = 'system') {
  const entry = {
    id: `lf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: String(input.item || '').trim() || 'Eşya',
    venueId: input.venueId || 'venue_olympos_beach',
    location: input.location || '',
    status: 'stored',
    foundBy: input.foundBy || actor,
    claimant: null,
    note: input.note || '',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lost-found', entry, 300);
  appendAudit({
    actor,
    action: 'lostfound.create',
    detail: entry.item,
    meta: { id: entry.id },
  });
  return entry;
}

export function updateLostFound(id, patch, actor = 'system') {
  const list = ensureSeed();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const allowed = ['item', 'venueId', 'location', 'status', 'claimant', 'note', 'foundBy'];
  const next = { ...list[idx] };
  for (const k of allowed) {
    if (patch[k] !== undefined) next[k] = patch[k];
  }
  next.updatedAt = new Date().toISOString();
  list[idx] = next;
  writeCollection('lost-found', list);
  appendAudit({
    actor,
    action: 'lostfound.update',
    detail: `${next.item} → ${next.status}`,
    meta: { id },
  });
  return next;
}

export function lostFoundSummary() {
  const list = listLostFound();
  return {
    total: list.length,
    stored: list.filter((x) => x.status === 'stored').length,
    returned: list.filter((x) => x.status === 'returned').length,
  };
}
