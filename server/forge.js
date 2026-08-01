/**
 * AŞAMA 510 — Forge checkpoint.
 */
import { buildCitadel } from './citadel.js';
import { createTalentdesk, listTalentdesk, talentdeskSummary, updateTalentdesk } from './talentdesk.js';
import { createCerttrack, certtrackSummary, listCerttrack, updateCerttrack } from './certtrack.js';
import { traininghubSummary } from './traininghub.js';
import { payrollrunSummary } from './payrollrun.js';
import { attritionSummary } from './attrition.js';
import { createShifttrade, listShifttrade, shifttradeSummary, updateShifttrade } from './shifttrade.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildForge() {
  const prev = buildCitadel();
  const talent = talentdeskSummary();
  const cert = certtrackSummary();
  const train = traininghubSummary();
  const pay = payrollrunSummary();
  const attr = attritionSummary();
  const swap = shifttradeSummary();
  const flags = readCollection('forge-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Forge',
    citadel: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    talentOffer: talent.offer || 0,
    certExpiring: cert.expiring || 0,
    trainLive: train.live || 0,
    payDraft: pay.draft || 0,
    attrNotice: attr.notice || 0,
    swapReq: swap.requested || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      talent_offer: talent.offer || 0,
      cert_expiring: cert.expiring || 0,
      swap_requested: swap.requested || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Talent offers ${talent.offer || 0} · Certs expiring ${cert.expiring || 0}`,
      `Training live ${train.live || 0} · Payroll draft ${pay.draft || 0}`,
      `Attrition notice ${attr.notice || 0} · Shift swaps ${swap.requested || 0}`,
      `Forge flag ${openFlags.length} açık`,
    ],
  };
}

export function runForgeSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const f = buildForge();
  const existing = readCollection('forge-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((x) => x.status === 'open').map((x) => x.key));
  const created = [];
  const candidates = [];
  if (force || (f.talentOffer || 0) > 0) {
    candidates.push({ key: 'talent_offer', level: 'warn', text: `Talent offers ${f.talentOffer || 0}`, domain: 'talent' });
  }
  if (force || (f.certExpiring || 0) > 0) {
    candidates.push({ key: 'cert_expiring', level: 'alert', text: `Certs expiring ${f.certExpiring || 0}`, domain: 'cert' });
  }
  if (force || (f.swapReq || 0) > 0) {
    candidates.push({ key: 'swap_req', level: 'info', text: `Shift swaps ${f.swapReq || 0}`, domain: 'shift' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Forge heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('fgf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('forge-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `forge sweep · ${created.length} flag`,
        priority: created.some((x) => x.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((x) => x.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('fgs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('forge-sweeps', sweep, 80);
  appendAudit({ actor, action: 'forge.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildForge() };
}

export function ackForgeFlag(input = {}, actor = 'system') {
  const list = readCollection('forge-flags', []) || [];
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
  writeCollection('forge-flags', list);
  appendAudit({ actor, action: 'forge.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildForge() };
}

export function advanceForgeTalent(input = {}, actor = 'system') {
  const offers = listTalentdesk().filter((t) => t.status === 'offer' || t.status === 'interview' || t.status === 'sourced');
  const advanced = [];
  for (const t of offers.slice(0, Number(input.limit) || 20)) {
    if (input.id && t.id !== input.id) continue;
    const nextStatus = t.status === 'offer' ? 'hired' : t.status === 'interview' ? 'offer' : 'interview';
    const next = updateTalentdesk(t.id, { status: nextStatus, advanced_by: actor }, actor);
    if (next) advanced.push(next.id);
  }
  if (!advanced.length) {
    const seeded = createTalentdesk({ candidate: 'forge-advance', role: 'FOH', status: 'offer' }, actor);
    const next = updateTalentdesk(seeded.id, { status: 'hired', advanced_by: actor }, actor);
    advanced.push((next || seeded).id);
  }
  appendAudit({ actor, action: 'forge.talent_advance', detail: `${advanced.length}`, meta: { n: advanced.length } });
  return { ok: true, advanced, overview: buildForge() };
}

export function renewForgeCert(input = {}, actor = 'system') {
  const expiring = listCerttrack().filter((c) => c.status === 'expiring' || c.status === 'expired');
  const renewed = [];
  for (const c of expiring.slice(0, Number(input.limit) || 20)) {
    if (input.id && c.id !== input.id) continue;
    const next = updateCerttrack(c.id, { status: 'valid', renewed_by: actor }, actor);
    if (next) renewed.push(next.id);
  }
  if (!renewed.length) {
    const seeded = createCerttrack({ person: 'forge', cert: 'First aid', status: 'valid' }, actor);
    renewed.push(seeded.id);
  }
  appendAudit({ actor, action: 'forge.cert_renew', detail: `${renewed.length}`, meta: { n: renewed.length } });
  return { ok: true, renewed, overview: buildForge() };
}

export function approveForgeShift(input = {}, actor = 'system') {
  const reqs = listShifttrade().filter((s) => s.status === 'requested');
  const approved = [];
  for (const s of reqs.slice(0, Number(input.limit) || 20)) {
    if (input.id && s.id !== input.id) continue;
    const next = updateShifttrade(s.id, { status: 'approved', approved_by: actor }, actor);
    if (next) approved.push(next.id);
  }
  if (!approved.length) {
    const seeded = createShifttrade({ from: 'forge', to: 'ops', status: 'approved' }, actor);
    approved.push(seeded.id);
  }
  enqueueAgentJob(
    {
      agent: 'HEPHAESTUS',
      title: `forge shift approve · ${approved.length}`,
      priority: 'normal',
      payload: { ids: approved },
    },
    actor,
  );
  appendAudit({ actor, action: 'forge.shift_approve', detail: `${approved.length}`, meta: { n: approved.length } });
  return { ok: true, approved, overview: buildForge() };
}
