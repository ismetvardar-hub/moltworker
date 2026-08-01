/**
 * AŞAMA 27 — Operasyon olay / incident panosu.
 * Envanter düşük stok, başarısız işler, geçiş reddi ve manuel kayıtları birleştirir.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { listInventory } from './inventory.js';
import { listJobs } from './jobs.js';
import { listAccessEvents } from './pass.js';

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
  return {
    total: list.length,
    open: open.length,
    critical: open.filter((i) => i.severity === 'critical').length,
    bySource: open.reduce((acc, i) => {
      acc[i.source] = (acc[i.source] || 0) + 1;
      return acc;
    }, {}),
  };
}
