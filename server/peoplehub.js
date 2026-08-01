/**
 * AŞAMA 270 — People Hub checkpoint (ledger + İK/kültür sinyalleri).
 */
import { buildLedger } from './ledger.js';
import { createOnboarding, listOnboarding, onboardingSummary, updateOnboarding } from './onboarding.js';
import { createLeaverequest, listLeaverequest, leaverequestSummary, updateLeaverequest } from './leaverequest.js';
import { attendanceSummary, createAttendance, listAttendance, updateAttendance } from './attendance.js';
import { certificationsSummary, createCertifications, listCertifications, updateCertifications } from './certifications.js';
import { createNearmiss, listNearmiss, nearmissSummary, updateNearmiss } from './nearmiss.js';
import { createWhistle, listWhistle, updateWhistle, whistleSummary } from './whistle.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildPeoplehub() {
  const led = buildLedger();
  const onb = onboardingSummary();
  const leave = leaverequestSummary();
  const att = attendanceSummary();
  const cert = certificationsSummary();
  const near = nearmissSummary();
  const wh = whistleSummary();
  const flags = readCollection('peoplehub-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const onboardingOpen = (onb.started || 0) + (onb.in_progress || 0);
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA People Hub',
    ledger: { summaryLines: (led.summaryLines || []).slice(0, 2) },
    onboardingOpen,
    leaveRequested: leave.requested || 0,
    absentToday: att.absent || 0,
    certExpiring: cert.expiring || 0,
    nearMissOpen: near.reported || 0,
    whistleOpen: wh.open || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      onboarding_open: onboardingOpen,
      leave_requested: leave.requested || 0,
      near_miss: near.reported || 0,
      whistle_open: wh.open || 0,
    },
    summaryLines: [
      ...(led.summaryLines || []).slice(0, 2),
      `Onboarding açık ${onboardingOpen} · İzin talep ${leave.requested || 0}`,
      `Yoklama absent ${att.absent || 0} · Sertifika bitiyor ${cert.expiring || 0}`,
      `Near miss ${near.reported || 0} · Etik bildirim açık ${wh.open || 0}`,
      `People Hub flag ${openFlags.length} açık`,
    ],
  };
}

export function runPeoplehubSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildPeoplehub();
  const existing = readCollection('peoplehub-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.leaveRequested || 0) > 0) {
    candidates.push({ key: 'leave_req', level: 'info', text: `İzin talep ${o.leaveRequested || 0}`, domain: 'leave' });
  }
  if (force || (o.nearMissOpen || 0) > 0 || (o.whistleOpen || 0) > 0) {
    candidates.push({
      key: 'safety_ethics',
      level: 'alert',
      text: `Near miss ${o.nearMissOpen || 0} · Whistle ${o.whistleOpen || 0}`,
      domain: 'safety',
    });
  }
  if (force || (o.onboardingOpen || 0) > 0 || (o.certExpiring || 0) > 0) {
    candidates.push({
      key: 'people_ops',
      level: 'warn',
      text: `Onboarding ${o.onboardingOpen || 0} · Cert expiring ${o.certExpiring || 0}`,
      domain: 'hr',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'People Hub heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('phf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('peoplehub-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `peoplehub sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('phs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('peoplehub-sweeps', sweep, 80);
  appendAudit({ actor, action: 'peoplehub.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildPeoplehub() };
}

export function ackPeoplehubFlag(input = {}, actor = 'system') {
  const list = readCollection('peoplehub-flags', []) || [];
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
  writeCollection('peoplehub-flags', list);
  appendAudit({ actor, action: 'peoplehub.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildPeoplehub() };
}

export function approvePeoplehubLeave(input = {}, actor = 'system') {
  const rows = listLeaverequest().filter((x) => x.status === 'requested');
  const approved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateLeaverequest(row.id, { status: 'approved', touched_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createLeaverequest({ employee: 'peoplehub', days: 1, status: 'approved' }, actor);
    approved.push(seeded.id);
  }
  appendAudit({ actor, action: 'peoplehub.leave_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildPeoplehub() };
}

export function closePeoplehubNearmiss(input = {}, actor = 'system') {
  const rows = listNearmiss().filter((x) => x.status === 'reported' || x.status === 'reviewed');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateNearmiss(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createNearmiss({ zone: 'Peoplehub', note: 'close-seed', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const w of listWhistle().filter((x) => x.status === 'open').slice(0, 5)) {
    updateWhistle(w.id, { status: 'investigating', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'peoplehub.nearmiss_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildPeoplehub() };
}

export function completePeoplehubOnboarding(input = {}, actor = 'system') {
  const rows = listOnboarding().filter((x) => x.status === 'started' || x.status === 'in_progress');
  const completed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateOnboarding(row.id, { status: 'done', touched_by: actor }, actor);
    if (next) completed.push(next.id);
  }
  if (!completed.length) {
    const seeded = createOnboarding({ employee: 'peoplehub', role: 'FOH', status: 'done' }, actor);
    completed.push(seeded.id);
  }
  for (const c of listCertifications().filter((x) => x.status === 'expiring' || x.status === 'expired').slice(0, 5)) {
    updateCertifications(c.id, { status: 'valid', touched_by: actor }, actor);
  }
  for (const a of listAttendance().filter((x) => x.status === 'absent').slice(0, 5)) {
    updateAttendance(a.id, { status: 'present', touched_by: actor }, actor);
  }
  enqueueAgentJob(
    {
      agent: 'ETHOS',
      title: `peoplehub onboarding complete · ${completed.length}`,
      priority: 'normal',
      payload: { ids: completed },
    },
    actor,
  );
  appendAudit({ actor, action: 'peoplehub.onboarding_complete', detail: `${completed.length}`, meta: { n: completed.length } });
  return { ok: true, completed, overview: buildPeoplehub() };
}
