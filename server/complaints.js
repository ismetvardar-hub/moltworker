/**
 * AŞAMA 56 — Şikayet / escalation kuyruğu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

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

function isOpenComplaint(c) {
  return c.status === 'open' || c.status === 'escalated' || c.status === 'in_progress';
}

function isAging(c, hours = 24) {
  if (!isOpenComplaint(c)) return false;
  const at = Date.parse(c.at || c.createdAt || 0);
  if (!Number.isFinite(at)) return false;
  return Date.now() - at > hours * 3600_000;
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
  const flags = readCollection('complaints-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const open = list.filter(isOpenComplaint);
  const aging = list.filter((c) => isAging(c));
  const severe = open.filter((c) => c.severity === 'high' || c.severity === 'critical');
  return {
    title: 'LİKYA Şikayet Ops',
    open: open.length,
    resolved: list.filter((c) => c.status === 'resolved').length,
    agingOpen: aging.length,
    severeOpen: severe.length,
    total: list.length,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      open: open.length,
      resolved: list.filter((c) => c.status === 'resolved').length,
      aging_open: aging.length,
      severe_open: severe.length,
      total: list.length,
    },
    summaryLines: [
      `Açık ${open.length} · yaşlanan ${aging.length} · yüksek/kritik ${severe.length}`,
      `Çözülen ${list.filter((c) => c.status === 'resolved').length} · complaint flag ${openFlags.length} açık`,
    ],
  };
}

export function runComplaintsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = complaintsSummary();
  const existing = readCollection('complaints-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.agingOpen || 0) > 0) {
    candidates.push({
      key: 'complaints_aging_open',
      level: (overview.agingOpen || 0) > 0 ? 'warn' : 'info',
      text: `Yaşlanan açık şikayet ${overview.agingOpen || 0}`,
      domain: 'aging',
    });
  }
  if (force || (overview.severeOpen || 0) > 0) {
    candidates.push({
      key: 'complaints_severe_open',
      level: (overview.severeOpen || 0) > 0 ? 'alert' : 'info',
      text: `Yüksek/kritik açık şikayet ${overview.severeOpen || 0}`,
      domain: 'severity',
    });
  }
  if (force || (overview.open || 0) > 0) {
    candidates.push({
      key: 'complaints_open_backlog',
      level: 'info',
      text: `Açık şikayet ${overview.open || 0}`,
      domain: 'backlog',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('cplf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('complaints-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `complaints sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('cpls'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('complaints-sweeps', sweep, 80);
  appendAudit({ actor, action: 'complaints.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: complaintsSummary() };
}

export function ackComplaintsFlag(input = {}, actor = 'system') {
  const list = readCollection('complaints-flags', []) || [];
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
  writeCollection('complaints-flags', list);
  appendAudit({ actor, action: 'complaints.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: complaintsSummary() };
}

/** Mutator 1 — escalate an open complaint. */
export function escalateComplaintOps(input = {}, actor = 'system') {
  const order = { low: 'medium', medium: 'high', high: 'critical', critical: 'critical' };
  let row = null;
  if (input.id) row = ensure().find((c) => c.id === input.id);
  if (!row) row = listComplaints().find((c) => isAging(c)) || listComplaints().find(isOpenComplaint);
  if (!row) row = seedAgingOpenComplaint({}, actor).complaint;
  if (!row) return { ok: false, error: 'Şikayet yok' };
  const nextSeverity = input.severity || order[row.severity] || 'high';
  const complaint = updateComplaint(
    row.id,
    {
      severity: nextSeverity,
      status: 'escalated',
      escalatedAt: new Date().toISOString(),
      escalatedBy: actor,
      note: input.note || row.note || 'ops escalation',
    },
    actor,
  );
  appendAudit({ actor, action: 'complaints.escalate_ops', detail: complaint?.subject || row.subject, meta: { id: row.id } });
  return { ok: true, complaint, escalated: complaint ? [complaint.id] : [], overview: complaintsSummary() };
}

/** Mutator 2 — resolve an open/escalated complaint. */
export function resolveComplaintOps(input = {}, actor = 'system') {
  let rows = listComplaints().filter((c) => c.status !== 'resolved');
  if (input.id) rows = rows.filter((c) => c.id === input.id);
  if (!rows.length && input.seed !== false) rows = [seedAgingOpenComplaint({}, actor).complaint].filter(Boolean);
  const resolved = [];
  let complaint = null;
  for (const row of rows.slice(0, Number(input.limit) || 10)) {
    const next = updateComplaint(
      row.id,
      {
        status: 'resolved',
        resolution: input.resolution || input.note || 'ops resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: actor,
      },
      actor,
    );
    if (next) {
      complaint = next;
      resolved.push(next.id);
    }
  }
  appendAudit({ actor, action: 'complaints.resolve_ops', detail: `${resolved.length}`, meta: { n: resolved.length } });
  return { ok: true, complaint, resolved, overview: complaintsSummary() };
}

/** Mutator 3 — seed an aging open complaint for SLA drills. */
export function seedAgingOpenComplaint(input = {}, actor = 'system') {
  const complaint = createComplaint(
    {
      subject: input.subject || 'Aging complaint seed',
      guestName: input.guestName || 'SLA Seed',
      venueId: input.venueId || 'venue_kaleici',
      severity: input.severity || 'high',
      body: input.body || '24 saat üstü açık şikayet seed',
    },
    actor,
  );
  const list = ensure();
  const idx = list.findIndex((c) => c.id === complaint.id);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      at: new Date(Date.now() - (Number(input.hours) || 30) * 3600_000).toISOString(),
    };
    writeCollection('complaints', list);
  }
  appendAudit({ actor, action: 'complaints.seed_aging', detail: complaint.subject, meta: { id: complaint.id } });
  return { ok: true, complaint: ensure().find((c) => c.id === complaint.id) || complaint, overview: complaintsSummary() };
}
