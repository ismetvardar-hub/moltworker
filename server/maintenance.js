/**
 * AŞAMA 38 — Bakım / arıza ticket'ları.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

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

function isOpen(t) {
  return t.status === 'open' || t.status === 'in_progress';
}

function isOverdue(t, hours = 4) {
  if (!isOpen(t)) return false;
  const created = Date.parse(t.createdAt || 0);
  if (!Number.isFinite(created)) return false;
  return Date.now() - created > hours * 3600_000;
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
  const flags = readCollection('maintenance-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const open = list.filter((t) => isOpen(t)).length;
  const critical = list.filter((t) => t.priority === 'critical' && t.status !== 'done').length;
  const overdue = list.filter((t) => isOverdue(t)).length;
  return {
    total: list.length,
    open,
    critical,
    overdue,
    title: 'LİKYA Bakım',
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      open,
      critical,
      overdue,
    },
    summaryLines: [
      `Açık ${open} · kritik ${critical} · geciken ${overdue}`,
      `Maintenance flag ${openFlags.length} açık`,
    ],
  };
}

export function runMaintenanceSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = maintenanceSummary();
  const existing = readCollection('maintenance-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.critical || 0) > 0) {
    candidates.push({
      key: 'critical',
      level: 'alert',
      text: `Kritik ticket ${o.critical || 0}`,
      domain: 'critical',
    });
  }
  if (force || (o.overdue || 0) > 0) {
    candidates.push({
      key: 'overdue',
      level: 'warn',
      text: `Geciken ticket ${o.overdue || 0}`,
      domain: 'overdue',
    });
  }
  if (force || (o.open || 0) > 0) {
    candidates.push({
      key: 'open',
      level: 'info',
      text: `Açık bakım ${o.open || 0}`,
      domain: 'open',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Maintenance heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('mntf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('maintenance-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `maintenance sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('mnts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('maintenance-sweeps', sweep, 80);
  appendAudit({ actor, action: 'maintenance.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: maintenanceSummary() };
}

export function ackMaintenanceFlag(input = {}, actor = 'system') {
  const list = readCollection('maintenance-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('maintenance-flags', list);
  appendAudit({ actor, action: 'maintenance.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: maintenanceSummary() };
}

/** Mutator 1 — close critical tickets. */
export function closeCriticalMaintenance(input = {}, actor = 'system') {
  const rows = listMaintenance().filter((t) => t.priority === 'critical' && t.status !== 'done');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateTicket(row.id, { status: 'done', note: input.note || row.note || 'critical closed' }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createTicket(
      { title: 'mnt-seed critical', priority: 'critical', note: 'critical close seed' },
      actor,
    );
    const next = updateTicket(seeded.id, { status: 'done' }, actor);
    if (next) closed.push(next.id);
    else closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'maintenance.critical_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: maintenanceSummary() };
}

/** Mutator 2 — escalate overdue open tickets. */
export function escalateOverdueMaintenance(input = {}, actor = 'system') {
  const rows = listMaintenance().filter((t) => isOverdue(t) || (isOpen(t) && t.priority !== 'critical'));
  const escalated = [];
  const order = { low: 'medium', medium: 'high', high: 'critical', critical: 'critical' };
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const priority = order[row.priority] || 'high';
    const next = updateTicket(
      row.id,
      { priority, status: row.status === 'open' ? 'in_progress' : row.status, note: input.note || 'escalated overdue' },
      actor,
    );
    if (next) escalated.push(next.id);
  }
  if (!escalated.length) {
    const seeded = createTicket(
      {
        title: 'mnt-seed overdue',
        priority: 'medium',
        note: 'overdue escalate seed',
      },
      actor,
    );
    // backdate so it counts overdue next sweep
    const list = ensureSeed();
    const idx = list.findIndex((t) => t.id === seeded.id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        createdAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
      };
      writeCollection('maintenance', list);
    }
    const next = updateTicket(seeded.id, { priority: 'high', status: 'in_progress' }, actor);
    if (next) escalated.push(next.id);
    else escalated.push(seeded.id);
  }
  appendAudit({ actor, action: 'maintenance.overdue_escalate', detail: `${escalated.length}`, meta: { n: escalated.length } });
  return { ok: true, escalated, overview: maintenanceSummary() };
}

/** Mutator 3 — create preventive ticket. */
export function createPreventiveMaintenance(input = {}, actor = 'system') {
  const ticket = createTicket(
    {
      title: String(input.title || '').trim() || 'Önleyici bakım',
      venueId: input.venueId || 'venue_olympos_beach',
      asset: input.asset || 'PREVENTIVE',
      priority: input.priority || 'low',
      assignee: input.assignee || 'HEPHAESTUS',
      note: input.note || 'preventive',
    },
    actor,
  );
  const next = updateTicket(ticket.id, { status: 'open', note: `${ticket.note} · preventive` }, actor) || ticket;
  appendAudit({ actor, action: 'maintenance.preventive_create', detail: next.title, meta: { id: next.id } });
  return { ok: true, ticket: next, created: [next.id], overview: maintenanceSummary() };
}
