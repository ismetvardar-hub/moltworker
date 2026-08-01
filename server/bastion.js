/**
 * AŞAMA 705 — Bastion checkpoint.
 */
import { buildVerdant } from './verdant.js';
import { accessgateSummary, createAccessgate, listAccessgate, updateAccessgate } from './accessgate.js';
import { createRolegrant, listRolegrant, rolegrantSummary, updateRolegrant } from './rolegrant.js';
import { createDevicetrust, devicetrustSummary, listDevicetrust, updateDevicetrust } from './devicetrust.js';
import { createMfareg, listMfareg, mfaregSummary, updateMfareg } from './mfareg.js';
import { createPrivacypol, listPrivacypol, privacypolSummary, updatePrivacypol } from './privacypol.js';
import { breachlogSummary, createBreachlog, listBreachlog, updateBreachlog } from './breachlog.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildBastion() {
  const prev = buildVerdant();
  const s0 = accessgateSummary();
  const s1 = rolegrantSummary();
  const s2 = devicetrustSummary();
  const s3 = mfaregSummary();
  const s4 = privacypolSummary();
  const s5 = breachlogSummary();
  const flags = readCollection('bastion-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Bastion',
    verdant: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    accessgateSig: s0.open || 0,
    rolegrantSig: s1.draft || 0,
    devicetrustSig: s2.planned || 0,
    mfaregSig: s3.idle || 0,
    privacypolSig: s4.open || 0,
    breachlogSig: s5.draft || 0,
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
      `Bastion flag ${openFlags.length} açık`,
    ],
  };
}

export function runBastionSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildBastion();
  const existing = readCollection('bastion-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.accessgateSig || 0) > 0) {
    candidates.push({ key: 'access_open', level: 'warn', text: `Access Gate ${o.accessgateSig || 0}`, domain: 'access' });
  }
  if (force || (o.breachlogSig || 0) > 0) {
    candidates.push({ key: 'breach_draft', level: 'alert', text: `Breach Log ${o.breachlogSig || 0}`, domain: 'breach' });
  }
  if (force || (o.mfaregSig || 0) > 0 || (o.rolegrantSig || 0) > 0) {
    candidates.push({
      key: 'identity_gap',
      level: 'warn',
      text: `MFA idle ${o.mfaregSig || 0} · Role draft ${o.rolegrantSig || 0}`,
      domain: 'identity',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Bastion heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('bsf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('bastion-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'NEXUS',
        title: `bastion sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('bss'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('bastion-sweeps', sweep, 80);
  appendAudit({ actor, action: 'bastion.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildBastion() };
}

export function ackBastionFlag(input = {}, actor = 'system') {
  const list = readCollection('bastion-flags', []) || [];
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
  writeCollection('bastion-flags', list);
  appendAudit({ actor, action: 'bastion.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildBastion() };
}

export function closeBastionAccess(input = {}, actor = 'system') {
  const rows = listAccessgate().filter((x) => x.status === 'open');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateAccessgate(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createAccessgate({ gate: 'Bastion', policy: 'lock', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'bastion.access_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildBastion() };
}

export function approveBastionRole(input = {}, actor = 'system') {
  const rows = listRolegrant().filter((x) => x.status === 'draft');
  const approved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRolegrant(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createRolegrant({ person: 'bastion', role: 'ops', status: 'live' }, actor);
    approved.push(seeded.id);
  }
  for (const m of listMfareg().filter((x) => x.status === 'idle').slice(0, 5)) {
    updateMfareg(m.id, { status: 'busy', touched_by: actor }, actor);
  }
  for (const d of listDevicetrust().filter((x) => x.status === 'planned').slice(0, 5)) {
    updateDevicetrust(d.id, { status: 'doing', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'bastion.role_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildBastion() };
}

export function archiveBastionBreach(input = {}, actor = 'system') {
  const rows = listBreachlog().filter((x) => x.status === 'draft' || x.status === 'live');
  const archived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBreachlog(row.id, { status: 'archived', touched_by: actor }, actor);
    if (next) archived.push(next.id);
  }
  if (!archived.length) {
    const seeded = createBreachlog({ severity: 'low', vector: 'bastion', status: 'archived' }, actor);
    archived.push(seeded.id);
  }
  for (const p of listPrivacypol().filter((x) => x.status === 'open').slice(0, 5)) {
    updatePrivacypol(p.id, { status: 'active', touched_by: actor }, actor);
  }
  enqueueAgentJob(
    {
      agent: 'NEXUS',
      title: `bastion breach archive · ${archived.length}`,
      priority: 'high',
      payload: { ids: archived },
    },
    actor,
  );
  appendAudit({ actor, action: 'bastion.breach_archive', detail: `${archived.length}`, meta: { n: archived.length } });
  return { ok: true, archived, overview: buildBastion() };
}
