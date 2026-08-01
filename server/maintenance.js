/**
 * AŞAMA 38 — Bakım / arıza ticket'ları.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensureSeed() {
  let list = readCollection('maintenance', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'mnt_1',
        title: 'Sahil turnike sesli uyarı zayıf',
        venueId: 'venue_olympos_beach',
        asset: 'NEXUS-GATE-01',
        priority: 'medium',
        status: 'open',
        assignee: 'NEXUS',
        note: 'Hoparlör kontrolü',
        createdAt: new Date(Date.now() - 5400_000).toISOString(),
        createdBy: 'system',
      },
    ];
    writeCollection('maintenance', list);
  }
  return list;
}

export function listMaintenance(filter = {}) {
  let list = ensureSeed();
  if (filter.status) list = list.filter((t) => t.status === filter.status);
  if (filter.venueId) list = list.filter((t) => t.venueId === filter.venueId);
  return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function createTicket(input, actor = 'system') {
  const ticket = {
    id: `mnt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: String(input.title || '').trim() || 'Bakım talebi',
    venueId: input.venueId || null,
    asset: input.asset || '',
    priority: input.priority || 'medium',
    status: 'open',
    assignee: input.assignee || '',
    note: input.note || '',
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('maintenance', ticket, 300);
  appendAudit({
    actor,
    action: 'maintenance.create',
    detail: ticket.title,
    meta: { id: ticket.id, priority: ticket.priority },
  });
  return ticket;
}

export function updateTicket(id, patch, actor = 'system') {
  const list = ensureSeed();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const allowed = ['title', 'venueId', 'asset', 'priority', 'status', 'assignee', 'note'];
  const next = { ...list[idx] };
  for (const k of allowed) {
    if (patch[k] !== undefined) next[k] = patch[k];
  }
  next.updatedAt = new Date().toISOString();
  if (next.status === 'done' && !next.completedAt) next.completedAt = next.updatedAt;
  list[idx] = next;
  writeCollection('maintenance', list);
  appendAudit({
    actor,
    action: 'maintenance.update',
    detail: `${next.title} → ${next.status}`,
    meta: { id },
  });
  return next;
}

export function maintenanceSummary() {
  const list = listMaintenance();
  return {
    total: list.length,
    open: list.filter((t) => t.status === 'open' || t.status === 'in_progress').length,
    critical: list.filter((t) => t.priority === 'critical' && t.status !== 'done').length,
  };
}
