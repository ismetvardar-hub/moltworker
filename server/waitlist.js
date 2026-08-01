/**
 * AŞAMA 55 — Misafir bekleme listesi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('waitlist', null);
  if (!Array.isArray(list)) {
    writeCollection('waitlist', []);
    return [];
  }
  return list;
}

export function listWaitlist(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((w) => w.status === filter.status);
  return list.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

export function createWaitlistEntry(input, actor = 'system') {
  const entry = {
    id: `wl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: String(input.guestName || '').trim() || 'Misafir',
    partySize: Math.max(1, Number(input.partySize) || 2),
    venueId: input.venueId || 'venue_olympos_beach',
    phone: input.phone || null,
    status: 'waiting',
    note: input.note || '',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('waitlist', entry, 200);
  appendAudit({
    actor,
    action: 'waitlist.create',
    detail: `${entry.guestName} ×${entry.partySize}`,
    meta: { id: entry.id },
  });
  return entry;
}

export function updateWaitlist(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((w) => w.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('waitlist', list);
  appendAudit({
    actor,
    action: 'waitlist.update',
    detail: `${list[idx].guestName} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function waitlistSummary() {
  const list = listWaitlist();
  return {
    waiting: list.filter((w) => w.status === 'waiting').length,
    seated: list.filter((w) => w.status === 'seated').length,
    total: list.length,
  };
}
