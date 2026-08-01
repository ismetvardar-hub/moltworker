/**
 * AŞAMA 915 — Bastion2 checkpoint.
 */
import { buildOlympus } from './olympus.js';
import { createAccessgate2, listAccessgate2, accessgate2Summary, updateAccessgate2 } from './accessgate2.js';
import { createRolegrant2, listRolegrant2, rolegrant2Summary, updateRolegrant2 } from './rolegrant2.js';
import { createDevicetrust2, listDevicetrust2, devicetrust2Summary, updateDevicetrust2 } from './devicetrust2.js';
import { createMfareg2, listMfareg2, mfareg2Summary, updateMfareg2 } from './mfareg2.js';
import { createPrivacypol2, listPrivacypol2, privacypol2Summary, updatePrivacypol2 } from './privacypol2.js';
import { createBreachlog2, listBreachlog2, breachlog2Summary, updateBreachlog2 } from './breachlog2.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildBastion2() {
  const prev = buildOlympus();
  const s0 = accessgate2Summary();
  const s1 = rolegrant2Summary();
  const s2 = devicetrust2Summary();
  const s3 = mfareg2Summary();
  const s4 = privacypol2Summary();
  const s5 = breachlog2Summary();
  const flags = readCollection('bastion2-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Bastion2',
    olympus: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    accessgate2Sig: s0.open || 0,
    rolegrant2Sig: s1.draft || 0,
    devicetrust2Sig: s2.planned || 0,
    mfareg2Sig: s3.idle || 0,
    privacypol2Sig: s4.open || 0,
    breachlog2Sig: s5.draft || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      access_open: s0.open || 0,
      role_draft: s1.draft || 0,
      breach_draft: s5.draft || 0,
      mfa_idle: s3.idle || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Access Gate ${s0.open || 0} · Role Grant ${s1.draft || 0}`,
      `Device Trust ${s2.planned || 0} · MFA Reg ${s3.idle || 0}`,
      `Privacy Pol ${s4.open || 0} · Breach Log ${s5.draft || 0}`,
      `Bastion2 flag ${openFlags.length} açık`,
    ],
  };
}

export function runBastion2Sweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildBastion2();
  const existing = readCollection('bastion2-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.breachlog2Sig || 0) > 0)) {
    candidates.push({ key: 'breach', level: 'alert', text: `Breach draft ${o.breachlog2Sig || 0}`, domain: 'breach' });
  }
  if (force || ((o.accessgate2Sig || 0) > 0 || (o.privacypol2Sig || 0) > 0)) {
    candidates.push({ key: 'access', level: 'warn', text: `Access open ${o.accessgate2Sig || 0} · Privacy ${o.privacypol2Sig || 0}`, domain: 'access' });
  }
  if (force || ((o.mfareg2Sig || 0) > 0 || (o.rolegrant2Sig || 0) > 0 || (o.devicetrust2Sig || 0) > 0)) {
    candidates.push({ key: 'identity', level: 'info', text: `MFA idle ${o.mfareg2Sig || 0} · Role draft ${o.rolegrant2Sig || 0}`, domain: 'identity' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Bastion2 heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('bs2f'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('bastion2-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'NEXUS', title: `bastion2 sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('bs2s'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('bastion2-sweeps', sweep, 80);
  appendAudit({ actor, action: 'bastion2.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildBastion2() };
}

export function ackBastion2Flag(input = {}, actor = 'system') {
  const list = readCollection('bastion2-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('bastion2-flags', list);
  appendAudit({ actor, action: 'bastion2.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildBastion2() };
}

export function closeBastion2Access(input = {}, actor = 'system') {
  const rows = listAccessgate2().filter((x) => x.status === 'open');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateAccessgate2(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createAccessgate2({ gate: 'Bastion2', policy: 'lock', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'bastion2.access_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildBastion2() };
}

export function approveBastion2Role(input = {}, actor = 'system') {
  const rows = listRolegrant2().filter((x) => x.status === 'draft');
  const approved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRolegrant2(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createRolegrant2({ person: 'bastion2', role: 'ops', status: 'live' }, actor);
    approved.push(seeded.id);
  }
  for (const m of listMfareg2().filter((x) => x.status === 'idle').slice(0, 5)) {
    updateMfareg2(m.id, { status: 'busy', touched_by: actor }, actor);
  }
  for (const d of listDevicetrust2().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateDevicetrust2(d.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'bastion2.role_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildBastion2() };
}

export function archiveBastion2Breach(input = {}, actor = 'system') {
  const rows = listBreachlog2().filter((x) => x.status === 'draft' || x.status === 'live');
  const archived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBreachlog2(row.id, { status: 'archived', touched_by: actor }, actor);
    if (next) archived.push(next.id);
  }
  if (!archived.length) {
    const seeded = createBreachlog2({ severity: 'low', vector: 'bastion2', status: 'archived' }, actor);
    archived.push(seeded.id);
  }
  for (const p of listPrivacypol2().filter((x) => x.status === 'open').slice(0, 5)) {
    updatePrivacypol2(p.id, { status: 'active', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'NEXUS', title: `bastion2 breach archive · ${archived.length}`, priority: 'high', payload: { ids: archived } }, actor);
  appendAudit({ actor, action: 'bastion2.breach_archive', detail: `${archived.length}`, meta: { n: archived.length } });
  return { ok: true, archived, overview: buildBastion2() };
}
