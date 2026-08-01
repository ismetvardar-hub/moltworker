/**
 * AŞAMA 375 — Keystone checkpoint.
 */
import { buildMirror } from './mirror.js';
import { createIncidentbus, listIncidentbus, incidentbusSummary, updateIncidentbus } from './incidentbus.js';
import { createSlotrack, listSlotrack, slotrackSummary, updateSlotrack } from './slotrack.js';
import { createErrorbudget, listErrorbudget, errorbudgetSummary, updateErrorbudget } from './errorbudget.js';
import { createStatuspage, listStatuspage, statuspageSummary, updateStatuspage } from './statuspage.js';
import { createEscalation, listEscalation, escalationSummary, updateEscalation } from './escalation.js';
import { createAfteraction, listAfteraction, afteractionSummary, updateAfteraction } from './afteraction.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildKeystone() {
  const prev = buildMirror();
  const bus = incidentbusSummary();
  const slo = slotrackSummary();
  const budget = errorbudgetSummary();
  const status = statuspageSummary();
  const esc = escalationSummary();
  const aa = afteractionSummary();
  const flags = readCollection('keystone-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Keystone',
    mirror: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    busDead: bus.dead || 0,
    sloBreached: slo.breached || 0,
    budgetExhausted: budget.exhausted || 0,
    statusOutage: status.outage || 0,
    escL3: esc.L3 || 0,
    actionsOpen: aa.open || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      bus_dead: bus.dead || 0,
      slo_breached: slo.breached || 0,
      budget_exhausted: budget.exhausted || 0,
      esc_l3: esc.L3 || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Incident bus dead ${bus.dead || 0} · SLO breached ${slo.breached || 0}`,
      `Error budget exhausted ${budget.exhausted || 0} · Status outage ${status.outage || 0}`,
      `Escalation L3 ${esc.L3 || 0} · After-action open ${aa.open || 0}`,
      `Keystone flag ${openFlags.length} açık`,
    ],
  };
}

export function runKeystoneSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildKeystone();
  const existing = readCollection('keystone-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.busDead || 0) > 0 || (o.actionsOpen || 0) > 0)) {
    candidates.push({ key: 'bus', level: 'alert', text: `Bus dead ${o.busDead || 0} · After-action ${o.actionsOpen || 0}`, domain: 'bus' });
  }
  if (force || ((o.sloBreached || 0) > 0 || (o.budgetExhausted || 0) > 0)) {
    candidates.push({ key: 'slo', level: 'warn', text: `SLO breached ${o.sloBreached || 0} · Budget ${o.budgetExhausted || 0}`, domain: 'slo' });
  }
  if (force || ((o.escL3 || 0) > 0 || (o.statusOutage || 0) > 0)) {
    candidates.push({ key: 'esc', level: 'info', text: `Esc L3 ${o.escL3 || 0} · Outage ${o.statusOutage || 0}`, domain: 'esc' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Keystone heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('ksf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('keystone-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ATLAS', title: `keystone sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('kss'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('keystone-sweeps', sweep, 80);
  appendAudit({ actor, action: 'keystone.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildKeystone() };
}

export function ackKeystoneFlag(input = {}, actor = 'system') {
  const list = readCollection('keystone-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('keystone-flags', list);
  appendAudit({ actor, action: 'keystone.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildKeystone() };
}

export function clearKeystoneBus(input = {}, actor = 'system') {
  const rows = listIncidentbus().filter((x) => x.status === 'dead' || x.status === 'queued');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateIncidentbus(row.id, { status: 'consumed', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createIncidentbus({ topic: 'keystone', payload: 'ok', status: 'consumed' }, actor);
    cleared.push(seeded.id);
  }
  for (const a of listAfteraction().filter((x) => x.status === 'open').slice(0, 5)) {
    updateAfteraction(a.id, { status: 'done', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'keystone.bus_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildKeystone() };
}

export function healKeystoneSlo(input = {}, actor = 'system') {
  const rows = listSlotrack().filter((x) => x.status === 'breached' || x.status === 'at_risk');
  const healed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSlotrack(row.id, { status: 'met', touched_by: actor }, actor);
    if (next) healed.push(next.id);
  }
  if (!healed.length) {
    const seeded = createSlotrack({ service: 'keystone', target: 99.5, status: 'met' }, actor);
    healed.push(seeded.id);
  }
  for (const b of listErrorbudget().filter((x) => x.status === 'exhausted' || x.status === 'burn').slice(0, 5)) {
    updateErrorbudget(b.id, { status: 'healthy', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'keystone.slo_heal', detail: `${healed.length}`, meta: { n: healed.length } });
  return { ok: true, healed, overview: buildKeystone() };
}

export function closeKeystoneEsc(input = {}, actor = 'system') {
  const rows = listEscalation().filter((x) => x.status === 'L3' || x.status === 'L2');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateEscalation(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createEscalation({ caseId: 'keystone', level: 1, status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const s of listStatuspage().filter((x) => x.status === 'outage' || x.status === 'degraded').slice(0, 5)) {
    updateStatuspage(s.id, { status: 'operational', state: 'operational', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ATLAS', title: `keystone esc_close · ${closed.length}`, priority: 'normal', payload: { ids: closed } }, actor);
  appendAudit({ actor, action: 'keystone.esc_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildKeystone() };
}
