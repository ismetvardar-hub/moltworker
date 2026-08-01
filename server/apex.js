/**
 * AŞAMA 150 — Apex checkpoint (orbit + finans/uyum sinyalleri).
 */
import { buildOrbit } from './orbit.js';
import { createInvoices, invoicesSummary, listInvoices, updateInvoices } from './invoices.js';
import { forecastSummary } from './forecast.js';
import { capexSummary, createCapex, listCapex, updateCapex } from './capex.js';
import { createLicenses, licensesSummary, listLicenses, updateLicenses } from './licenses.js';
import { createSlabreaches, listSlabreaches, slabreachesSummary, updateSlabreaches } from './slabreaches.js';
import { createHealthcards, healthcardsSummary, listHealthcards, updateHealthcards } from './healthcards.js';
import { createOvertime, listOvertime, overtimeSummary, updateOvertime } from './overtime.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildApex() {
  const orbit = buildOrbit();
  const inv = invoicesSummary();
  const fc = forecastSummary();
  const cx = capexSummary();
  const lic = licensesSummary();
  const sla = slabreachesSummary();
  const hc = healthcardsSummary();
  const ot = overtimeSummary();
  const flags = readCollection('apex-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Apex',
    orbit: { summaryLines: (orbit.summaryLines || []).slice(0, 2) },
    invoicesOverdue: inv.overdue || 0,
    forecastLocked: fc.locked || 0,
    capexProposed: cx.proposed || 0,
    licensesExpiring: lic.expiring || 0,
    slaOpen: sla.open || 0,
    healthExpiring: hc.expiring || 0,
    overtimeOpen: ot.requested || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      invoices_overdue: inv.overdue || 0,
      licenses_expiring: lic.expiring || 0,
      sla_open: sla.open || 0,
      overtime_open: ot.requested || 0,
    },
    summaryLines: [
      ...(orbit.summaryLines || []).slice(0, 2),
      `Fatura gecikmiş ${inv.overdue || 0} · Forecast kilit ${fc.locked || 0}`,
      `CAPEX öneri ${cx.proposed || 0} · Ruhsat bitiyor ${lic.expiring || 0}`,
      `SLA açık ${sla.open || 0} · Sağlık kartı bitiyor ${hc.expiring || 0}`,
      `Mesai talep ${ot.requested || 0}`,
      `Apex flag ${openFlags.length} açık`,
    ],
  };
}

export function runApexSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildApex();
  const existing = readCollection('apex-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.invoicesOverdue || 0) > 0) {
    candidates.push({ key: 'inv_overdue', level: 'alert', text: `Fatura gecikmiş ${o.invoicesOverdue || 0}`, domain: 'finance' });
  }
  if (force || (o.slaOpen || 0) > 0 || (o.licensesExpiring || 0) > 0) {
    candidates.push({
      key: 'compliance_pressure',
      level: 'warn',
      text: `SLA ${o.slaOpen || 0} · Ruhsat ${o.licensesExpiring || 0}`,
      domain: 'compliance',
    });
  }
  if (force || (o.overtimeOpen || 0) > 0 || (o.capexProposed || 0) > 0) {
    candidates.push({
      key: 'ops_finance',
      level: 'info',
      text: `Mesai ${o.overtimeOpen || 0} · CAPEX ${o.capexProposed || 0}`,
      domain: 'ops',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Apex heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('apf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('apex-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `apex sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('aps'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('apex-sweeps', sweep, 80);
  appendAudit({ actor, action: 'apex.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildApex() };
}

export function ackApexFlag(input = {}, actor = 'system') {
  const list = readCollection('apex-flags', []) || [];
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
  writeCollection('apex-flags', list);
  appendAudit({ actor, action: 'apex.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildApex() };
}

export function clearApexInvoices(input = {}, actor = 'system') {
  const rows = listInvoices().filter((x) => x.status === 'overdue' || x.status === 'open');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateInvoices(row.id, { status: 'paid', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createInvoices({ vendor: 'apex', amount: 1, status: 'paid' }, actor);
    cleared.push(seeded.id);
  }
  appendAudit({ actor, action: 'apex.invoice_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildApex() };
}

export function renewApexLicenses(input = {}, actor = 'system') {
  const rows = listLicenses().filter((x) => x.status === 'expiring' || x.status === 'expired');
  const renewed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateLicenses(row.id, { status: 'valid', touched_by: actor }, actor);
    if (next) renewed.push(next.id);
  }
  if (!renewed.length) {
    const seeded = createLicenses({ name: 'apex-lic', expires: '2027-01-01', status: 'valid' }, actor);
    renewed.push(seeded.id);
  }
  for (const s of listSlabreaches().filter((x) => x.status === 'open').slice(0, 5)) {
    updateSlabreaches(s.id, { status: 'mitigated', touched_by: actor }, actor);
  }
  for (const h of listHealthcards().filter((x) => x.status === 'expiring' || x.status === 'expired').slice(0, 5)) {
    updateHealthcards(h.id, { status: 'valid', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'apex.license_renew', detail: `${renewed.length}`, meta: { n: renewed.length } });
  return { ok: true, renewed, overview: buildApex() };
}

export function approveApexOvertime(input = {}, actor = 'system') {
  const rows = listOvertime().filter((x) => x.status === 'requested');
  const approved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateOvertime(row.id, { status: 'approved', touched_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createOvertime({ employee: 'apex', hours: 2, status: 'approved' }, actor);
    approved.push(seeded.id);
  }
  for (const c of listCapex().filter((x) => x.status === 'proposed').slice(0, 5)) {
    updateCapex(c.id, { status: 'approved', touched_by: actor }, actor);
  }
  enqueueAgentJob(
    {
      agent: 'ETHOS',
      title: `apex overtime approve · ${approved.length}`,
      priority: 'normal',
      payload: { ids: approved },
    },
    actor,
  );
  appendAudit({ actor, action: 'apex.overtime_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildApex() };
}
