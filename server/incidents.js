/**
 * AŞAMA 27 — Operasyon olay / incident panosu.
 * Envanter düşük stok, başarısız işler, geçiş reddi ve manuel kayıtları birleştirir.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';
import { listInventory } from './inventory.js';
import { listJobs } from './jobs.js';
import { listAccessEvents } from './pass.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function ensureManual() {
  const list = readCollection('incidents', null);
  if (!Array.isArray(list)) {
    writeCollection('incidents', []);
    return [];
  }
  return list;
}

function derivedIncidents() {
  const now = Date.now();
  const out = [];

  for (const item of listInventory()) {
    if (item.low || item.qty <= item.minQty) {
      out.push({
        id: `inc_stock_${item.id}`,
        source: 'inventory',
        severity: item.qty === 0 ? 'critical' : 'warning',
        title: `Düşük stok: ${item.name}`,
        detail: `${item.qty} ${item.unit} (eşik ${item.minQty}) · ${item.venueId}`,
        status: 'open',
        at: item.updatedAt || new Date(now).toISOString(),
        meta: { itemId: item.id, sku: item.sku },
      });
    }
  }

  for (const job of listJobs().filter((j) => j.status === 'failed').slice(0, 20)) {
    out.push({
      id: `inc_job_${job.id}`,
      source: 'jobs',
      severity: 'error',
      title: `Görev başarısız: ${job.kind || job.title || job.id}`,
      detail: job.error || job.result?.error || 'Bilinmeyen hata',
      status: 'open',
      at: job.updatedAt || job.createdAt || new Date(now).toISOString(),
      meta: { jobId: job.id },
    });
  }

  for (const ev of listAccessEvents().filter((e) => e.allowed === false).slice(0, 15)) {
    out.push({
      id: `inc_pass_${ev.id}`,
      source: 'pass',
      severity: 'warning',
      title: `Geçiş reddi: ${ev.holderName || 'bilinmeyen'}`,
      detail: `Kapı ${ev.gateName || ev.gateId || '—'} · ${ev.reason || 'yetki yok'}`,
      status: 'open',
      at: ev.at || new Date(now).toISOString(),
      meta: { eventId: ev.id },
    });
  }

  return out;
}

export function listIncidents({ includeDerived = true } = {}) {
  const manual = ensureManual();
  const derived = includeDerived ? derivedIncidents() : [];
  const ack = new Set(
    readCollection('incident-acks', [])
      .filter((a) => a.status === 'acked' || a.status === 'resolved')
      .map((a) => a.incidentId),
  );

  const merged = [...manual, ...derived].map((inc) => {
    if (ack.has(inc.id) && inc.status === 'open') {
      const a = readCollection('incident-acks', []).find((x) => x.incidentId === inc.id);
      return { ...inc, status: a?.status || 'acked', ackedBy: a?.actor, ackedAt: a?.at };
    }
    return inc;
  });

  const rank = { critical: 0, error: 1, warning: 2, info: 3 };
  return merged.sort((a, b) => {
    const rs = (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9);
    if (rs !== 0) return rs;
    return String(b.at).localeCompare(String(a.at));
  });
}

export function createIncident(input, actor = 'system') {
  const incident = {
    id: `inc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    source: 'manual',
    severity: input.severity || 'info',
    title: String(input.title || '').trim() || 'Manuel olay',
    detail: input.detail || '',
    status: 'open',
    at: new Date().toISOString(),
    createdBy: actor,
    meta: input.meta || {},
  };
  prependItem('incidents', incident, 200);
  appendAudit({
    actor,
    action: 'incidents.create',
    detail: incident.title,
    meta: { id: incident.id, severity: incident.severity },
  });
  return incident;
}

export function ackIncident(id, status = 'acked', actor = 'system') {
  const incidents = listIncidents({ includeDerived: true });
  const found = incidents.find((i) => i.id === id);
  if (!found) return null;

  if (found.source === 'manual') {
    const list = ensureManual();
    const idx = list.findIndex((i) => i.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status,
        ackedBy: actor,
        ackedAt: new Date().toISOString(),
      };
      writeCollection('incidents', list);
    }
  }

  const acks = readCollection('incident-acks', []);
  const next = [
    {
      incidentId: id,
      status,
      actor,
      at: new Date().toISOString(),
    },
    ...acks.filter((a) => a.incidentId !== id),
  ].slice(0, 500);
  writeCollection('incident-acks', next);

  appendAudit({
    actor,
    action: 'incidents.ack',
    detail: `${found.title} → ${status}`,
    meta: { id, status },
  });
  return { ...found, status, ackedBy: actor, ackedAt: new Date().toISOString() };
}

export function incidentsSummary() {
  const list = listIncidents();
  const open = list.filter((i) => i.status === 'open');
  const critical = open.filter((i) => i.severity === 'critical').length;
  const errors = open.filter((i) => i.severity === 'error' || i.severity === 'critical').length;
  const flags = readCollection('incidents-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    total: list.length,
    open: open.length,
    critical,
    errors,
    bySource: open.reduce((acc, i) => {
      acc[i.source] = (acc[i.source] || 0) + 1;
      return acc;
    }, {}),
    title: 'LİKYA Olay',
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      open: open.length,
      critical,
      errors,
      total: list.length,
    },
    summaryLines: [
      `Açık ${open.length} · kritik ${critical} · hata ${errors}`,
      `Incidents flag ${openFlags.length} açık`,
    ],
  };
}

export function runIncidentsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = incidentsSummary();
  const existing = readCollection('incidents-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.critical || 0) > 0) {
    candidates.push({
      key: 'critical',
      level: 'alert',
      text: `Kritik olay ${o.critical || 0}`,
      domain: 'critical',
    });
  }
  if (force || (o.open || 0) > 0) {
    candidates.push({
      key: 'open',
      level: 'warn',
      text: `Açık olay ${o.open || 0}`,
      domain: 'open',
    });
  }
  if (force || (o.errors || 0) > 0) {
    candidates.push({
      key: 'errors',
      level: 'info',
      text: `Hata/kritik ${o.errors || 0}`,
      domain: 'errors',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Incidents heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('incdf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('incidents-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `incidents sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('incds'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('incidents-sweeps', sweep, 80);
  appendAudit({ actor, action: 'incidents.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: incidentsSummary() };
}

export function ackIncidentsFlag(input = {}, actor = 'system') {
  const list = readCollection('incidents-flags', []) || [];
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
  writeCollection('incidents-flags', list);
  appendAudit({ actor, action: 'incidents.flag_ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: incidentsSummary() };
}

/** Mutator 1 — ack open/critical incidents. */
export function ackOpenCriticalIncidents(input = {}, actor = 'system') {
  const rows = listIncidents().filter(
    (i) => i.status === 'open' && (i.severity === 'critical' || i.severity === 'error' || input.all),
  );
  const acked = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = ackIncident(row.id, 'acked', actor);
    if (next) acked.push(next.id);
  }
  if (!acked.length) {
    const seeded = createIncident(
      { title: 'incd-seed critical', severity: 'critical', detail: 'ack open/critical seed' },
      actor,
    );
    const next = ackIncident(seeded.id, 'acked', actor);
    if (next) acked.push(next.id);
    else acked.push(seeded.id);
  }
  appendAudit({ actor, action: 'incidents.ack_open_critical', detail: `${acked.length}`, meta: { n: acked.length } });
  return { ok: true, acked, overview: incidentsSummary() };
}

/** Mutator 2 — resolve/close open incidents. */
export function resolveOpenIncidents(input = {}, actor = 'system') {
  const rows = listIncidents().filter((i) => i.status === 'open' || i.status === 'acked');
  const resolved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = ackIncident(row.id, 'resolved', actor);
    if (next) resolved.push(next.id);
  }
  if (!resolved.length) {
    const seeded = createIncident(
      { title: 'incd-seed resolve', severity: 'warning', detail: 'resolve close seed' },
      actor,
    );
    const next = ackIncident(seeded.id, 'resolved', actor);
    if (next) resolved.push(next.id);
    else resolved.push(seeded.id);
  }
  appendAudit({ actor, action: 'incidents.resolve_open', detail: `${resolved.length}`, meta: { n: resolved.length } });
  return { ok: true, resolved, overview: incidentsSummary() };
}

/** Mutator 3 — escalate severity or create from seed. */
export function escalateIncidentSeverity(input = {}, actor = 'system') {
  const order = { info: 'warning', warning: 'error', error: 'critical', critical: 'critical' };
  const list = ensureManual();
  const open = listIncidents().filter((i) => i.status === 'open' && i.source === 'manual');
  const escalated = [];
  for (const row of open.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const severity = order[row.severity] || 'error';
    const idx = list.findIndex((i) => i.id === row.id);
    if (idx < 0) continue;
    list[idx] = {
      ...list[idx],
      severity,
      detail: `${list[idx].detail || ''} · escalated`.trim(),
      updatedAt: new Date().toISOString(),
    };
    escalated.push(list[idx].id);
  }
  if (escalated.length) writeCollection('incidents', list);
  if (!escalated.length) {
    const seeded = createIncident(
      {
        title: String(input.title || '').trim() || 'incd-seed escalate',
        severity: input.severity || 'warning',
        detail: input.detail || 'escalate seed',
      },
      actor,
    );
    const raw = ensureManual();
    const idx = raw.findIndex((i) => i.id === seeded.id);
    if (idx >= 0) {
      raw[idx] = { ...raw[idx], severity: 'critical' };
      writeCollection('incidents', raw);
    }
    escalated.push(seeded.id);
  }
  appendAudit({
    actor,
    action: 'incidents.escalate_severity',
    detail: `${escalated.length}`,
    meta: { n: escalated.length },
  });
  return { ok: true, escalated, overview: incidentsSummary() };
}
