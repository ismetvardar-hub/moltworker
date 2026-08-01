/**
 * AŞAMA 1065 — Elysium checkpoint.
 */
import { buildPhoenix2 } from './phoenix2.js';
import { createAccessgate3, listAccessgate3, accessgate3Summary, updateAccessgate3 } from './accessgate3.js';
import { createRolegrant3, listRolegrant3, rolegrant3Summary, updateRolegrant3 } from './rolegrant3.js';
import { createDevicetrust3, listDevicetrust3, devicetrust3Summary, updateDevicetrust3 } from './devicetrust3.js';
import { createMfareg3, listMfareg3, mfareg3Summary, updateMfareg3 } from './mfareg3.js';
import { createPrivacypol3, listPrivacypol3, privacypol3Summary, updatePrivacypol3 } from './privacypol3.js';
import { createBreachlog3, listBreachlog3, breachlog3Summary, updateBreachlog3 } from './breachlog3.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildElysium() {
  const prev = buildPhoenix2();
  const s0 = accessgate3Summary();
  const s1 = rolegrant3Summary();
  const s2 = devicetrust3Summary();
  const s3 = mfareg3Summary();
  const s4 = privacypol3Summary();
  const s5 = breachlog3Summary();
  const flags = readCollection('elysium-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Elysium',
    phoenix2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    accessgate3Sig: s0.open || 0,
    rolegrant3Sig: s1.draft || 0,
    devicetrust3Sig: s2.planned || 0,
    mfareg3Sig: s3.idle || 0,
    privacypol3Sig: s4.open || 0,
    breachlog3Sig: s5.draft || 0,
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
      `Elysium flag ${openFlags.length} açık`,
    ],
  };
}

export function runElysiumSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildElysium();
  const existing = readCollection('elysium-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.breachlog3Sig || 0) > 0)) {
    candidates.push({ key: 'breach', level: 'alert', text: `Breach Log ${o.breachlog3Sig || 0}`, domain: 'breach' });
  }
  if (force || ((o.accessgate3Sig || 0) > 0)) {
    candidates.push({ key: 'access', level: 'warn', text: `Access Gate ${o.accessgate3Sig || 0}`, domain: 'access' });
  }
  if (force || ((o.mfareg3Sig || 0) > 0 || (o.rolegrant3Sig || 0) > 0)) {
    candidates.push({ key: 'identity', level: 'info', text: `MFA idle ${o.mfareg3Sig || 0} · Role draft ${o.rolegrant3Sig || 0}`, domain: 'identity' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Elysium heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('elf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('elysium-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'NEXUS', title: `elysium sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('els'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('elysium-sweeps', sweep, 80);
  appendAudit({ actor, action: 'elysium.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildElysium() };
}

export function ackElysiumFlag(input = {}, actor = 'system') {
  const list = readCollection('elysium-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('elysium-flags', list);
  appendAudit({ actor, action: 'elysium.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildElysium() };
}

export function closeElysiumAccess(input = {}, actor = 'system') {
  const rows = listAccessgate3().filter((x) => x.status === 'open');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateAccessgate3(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createAccessgate3({ gate: 'E1', policy: 'lock', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'elysium.access_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildElysium() };
}

export function approveElysiumRole(input = {}, actor = 'system') {
  const rows = listRolegrant3().filter((x) => x.status === 'draft');
  const approved = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRolegrant3(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createRolegrant3({ person: 'elysium', role: 'ops', status: 'live' }, actor);
    approved.push(seeded.id);
  }
  for (const m of listMfareg3().filter((x) => x.status === 'idle').slice(0, 5)) { updateMfareg3(m.id, { status: 'busy', touched_by: actor }, actor); }
  for (const d of listDevicetrust3().filter((x) => x.status === 'planned').slice(0, 5)) { updateDevicetrust3(d.id, { status: 'doing', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'elysium.role_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildElysium() };
}

export function archiveElysiumBreach(input = {}, actor = 'system') {
  const rows = listBreachlog3().filter((x) => x.status === 'draft' || x.status === 'live');
  const archived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBreachlog3(row.id, { status: 'archived', touched_by: actor }, actor);
    if (next) archived.push(next.id);
  }
  if (!archived.length) {
    const seeded = createBreachlog3({ severity: 'low', vector: 'elysium', status: 'archived' }, actor);
    archived.push(seeded.id);
  }
  for (const p of listPrivacypol3().filter((x) => x.status === 'open').slice(0, 5)) { updatePrivacypol3(p.id, { status: 'active', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'NEXUS', title: `elysium breach_archive · ${archived.length}`, priority: 'high', payload: { ids: archived } }, actor);
  appendAudit({ actor, action: 'elysium.breach_archive', detail: `${archived.length}`, meta: { n: archived.length } });
  return { ok: true, archived, overview: buildElysium() };
}
