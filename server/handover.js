/**
 * AŞAMA 44 — Vardiya teslim / personel notları.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensureSeed() {
  let list = readCollection('handover-notes', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'ho_1',
        venueId: 'venue_olympos_beach',
        fromShift: '08:00–16:00',
        toShift: '16:00–00:00',
        author: 'Ayşe T.',
        body: 'VIP masa T12 rezervasyon geldi; RFID okuyucu 2 kez takıldı, NEXUS bakıma yazıldı.',
        priority: 'high',
        at: new Date(Date.now() - 3600_000).toISOString(),
      },
    ];
    writeCollection('handover-notes', list);
  }
  return list;
}

export function listHandover(filter = {}) {
  let list = ensureSeed();
  if (filter.venueId) list = list.filter((n) => n.venueId === filter.venueId);
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function createHandover(input, actor = 'system') {
  const note = {
    id: `ho_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    venueId: input.venueId || 'venue_olympos_beach',
    fromShift: input.fromShift || '',
    toShift: input.toShift || '',
    author: input.author || actor,
    body: String(input.body || '').trim() || '—',
    priority: input.priority || 'normal',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('handover-notes', note, 300);
  appendAudit({
    actor,
    action: 'handover.create',
    detail: `${note.venueId}: ${note.body.slice(0, 80)}`,
    meta: { id: note.id, priority: note.priority },
  });
  return note;
}

export function handoverSummary() {
  const list = listHandover();
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: list.length,
    today: list.filter((n) => n.at?.slice(0, 10) === today).length,
    high: list.filter((n) => n.priority === 'high').length,
  };
}
