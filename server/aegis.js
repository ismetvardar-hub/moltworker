/**
 * AŞAMA 525 — Aegis checkpoint.
 */
import { buildForge } from './forge.js';
import { createSafetylog, listSafetylog, safetylogSummary, updateSafetylog } from './safetylog.js';
import { createIncidentlog, incidentlogSummary, listIncidentlog, updateIncidentlog } from './incidentlog.js';
import { createEvacroute, evacrouteSummary, listEvacroute, updateEvacroute } from './evacroute.js';
import { lockouttagSummary } from './lockouttag.js';
import { compliancerowSummary } from './compliancerow.js';
import { hazmatbaySummary } from './hazmatbay.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildAegis() {
  const prev = buildForge();
  const safe = safetylogSummary();
  const inc = incidentlogSummary();
  const evac = evacrouteSummary();
  const loto = lockouttagSummary();
  const cmp = compliancerowSummary();
  const haz = hazmatbaySummary();
  const flags = readCollection('aegis-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Aegis',
    forge: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    safetyOpen: safe.open || 0,
    incInvestigating: inc.investigating || 0,
    evacBlocked: evac.blocked || 0,
    lotoApplied: loto.applied || 0,
    cmpGap: cmp.gap || 0,
    hazSpill: haz.spill || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      safety_open: safe.open || 0,
      inc_investigating: inc.investigating || 0,
      evac_blocked: evac.blocked || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Safety open ${safe.open || 0} · Incidents investigating ${inc.investigating || 0}`,
      `Evac blocked ${evac.blocked || 0} · LOTO applied ${loto.applied || 0}`,
      `Compliance gaps ${cmp.gap || 0} · Hazmat spill ${haz.spill || 0}`,
      `Aegis flag ${openFlags.length} açık`,
    ],
  };
}

export function runAegisSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const a = buildAegis();
  const existing = readCollection('aegis-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (a.safetyOpen || 0) > 0) {
    candidates.push({ key: 'safety_open', level: 'alert', text: `Safety open ${a.safetyOpen || 0}`, domain: 'safety' });
  }
  if (force || (a.incInvestigating || 0) > 0) {
    candidates.push({ key: 'inc_invest', level: 'warn', text: `Incidents investigating ${a.incInvestigating || 0}`, domain: 'incident' });
  }
  if (force || (a.evacBlocked || 0) > 0) {
    candidates.push({ key: 'evac_blocked', level: 'alert', text: `Evac blocked ${a.evacBlocked || 0}`, domain: 'evac' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Aegis heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('aef'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('aegis-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `aegis sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('aes'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('aegis-sweeps', sweep, 80);
  appendAudit({ actor, action: 'aegis.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildAegis() };
}

export function ackAegisFlag(input = {}, actor = 'system') {
  const list = readCollection('aegis-flags', []) || [];
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
  writeCollection('aegis-flags', list);
  appendAudit({ actor, action: 'aegis.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildAegis() };
}

export function clearAegisSafety(input = {}, actor = 'system') {
  const open = listSafetylog().filter((s) => s.status === 'open');
  const cleared = [];
  for (const s of open.slice(0, Number(input.limit) || 20)) {
    if (input.id && s.id !== input.id) continue;
    const next = updateSafetylog(s.id, { status: 'closed', cleared_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createSafetylog({ note: 'aegis clear-seed', status: 'closed' }, actor);
    cleared.push(seeded.id);
  }
  appendAudit({ actor, action: 'aegis.safety_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildAegis() };
}

export function closeAegisIncident(input = {}, actor = 'system') {
  const open = listIncidentlog().filter((i) => i.status === 'investigating' || i.status === 'reported');
  const closed = [];
  for (const i of open.slice(0, Number(input.limit) || 20)) {
    if (input.id && i.id !== input.id) continue;
    const next = updateIncidentlog(i.id, { status: 'closed', closed_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createIncidentlog({ type: 'aegis-close-seed', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'aegis.incident_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildAegis() };
}

export function clearAegisEvac(input = {}, actor = 'system') {
  const blocked = listEvacroute().filter((e) => e.status === 'blocked');
  const cleared = [];
  for (const e of blocked.slice(0, Number(input.limit) || 20)) {
    if (input.id && e.id !== input.id) continue;
    const next = updateEvacroute(e.id, { status: 'clear', cleared_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createEvacroute({ route: input.route || 'Aegis', status: 'clear' }, actor);
    cleared.push(seeded.id);
  }
  enqueueAgentJob(
    {
      agent: 'NEXUS',
      title: `aegis evac clear · ${cleared.length}`,
      priority: 'high',
      payload: { ids: cleared },
    },
    actor,
  );
  appendAudit({ actor, action: 'aegis.evac_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildAegis() };
}
