/**
 * AŞAMA 56 — Şikayet / escalation kuyruğu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('complaints', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'cpl_1',
        subject: 'Servis gecikmesi',
        guestName: 'Mert A.',
        venueId: 'venue_kaleici',
        severity: 'medium',
        status: 'open',
        body: 'Köfte menü 25 dk sürdü.',
        at: new Date(Date.now() - 1800_000).toISOString(),
      },
    ];
    writeCollection('complaints', seed);
    return seed;
  }
  return list;
}

export function listComplaints(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((c) => c.status === filter.status);
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

export function createComplaint(input, actor = 'system') {
  const c = {
    id: `cpl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    subject: String(input.subject || '').trim() || 'Şikayet',
    guestName: input.guestName || 'Anonim',
    venueId: input.venueId || null,
    severity: input.severity || 'medium',
    status: 'open',
    body: input.body || '',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('complaints', c, 300);
  appendAudit({
    actor,
    action: 'complaints.create',
    detail: `${c.subject} (${c.severity})`,
    meta: { id: c.id },
  });
  return c;
}

export function updateComplaint(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('complaints', list);
  appendAudit({
    actor,
    action: 'complaints.update',
    detail: `${list[idx].subject} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function complaintsSummary() {
  const list = listComplaints();
  return {
    open: list.filter((c) => c.status === 'open').length,
    resolved: list.filter((c) => c.status === 'resolved').length,
    total: list.length,
  };
}
