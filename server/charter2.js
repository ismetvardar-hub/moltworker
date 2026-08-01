/**
 * AŞAMA 1035 — Charter2 checkpoint.
 */
import { buildCrucible2 } from './crucible2.js';
import { createIpvault2, listIpvault2, ipvault2Summary, updateIpvault2 } from './ipvault2.js';
import { createRiskreg2, listRiskreg2, riskreg2Summary, updateRiskreg2 } from './riskreg2.js';
import { createClaimdesk2, listClaimdesk2, claimdesk2Summary, updateClaimdesk2 } from './claimdesk2.js';
import { createLitigation2, listLitigation2, litigation2Summary, updateLitigation2 } from './litigation2.js';
import { createEthicsline2, listEthicsline2, ethicsline2Summary, updateEthicsline2 } from './ethicsline2.js';
import { createSanctions2, listSanctions2, sanctions2Summary, updateSanctions2 } from './sanctions2.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildCharter2() {
  const prev = buildCrucible2();
  const s0 = ipvault2Summary();
  const s1 = riskreg2Summary();
  const s2 = claimdesk2Summary();
  const s3 = litigation2Summary();
  const s4 = ethicsline2Summary();
  const s5 = sanctions2Summary();
  const flags = readCollection('charter2-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Charter2',
    crucible2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    ipvault2Sig: s0.open || 0,
    riskreg2Sig: s1.draft || 0,
    claimdesk2Sig: s2.planned || 0,
    litigation2Sig: s3.idle || 0,
    ethicsline2Sig: s4.open || 0,
    sanctions2Sig: s5.draft || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      ethics_open: s4.open || 0,
      risk_draft: s1.draft || 0,
      ip_open: s0.open || 0,
      claims_planned: s2.planned || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `IP Vault ${s0.open || 0} · Risk Reg ${s1.draft || 0}`,
      `Claim Desk ${s2.planned || 0} · Litigation ${s3.idle || 0}`,
      `Ethics Line ${s4.open || 0} · Sanctions ${s5.draft || 0}`,
      `Charter2 flag ${openFlags.length} açık`,
    ],
  };
}

export function runCharter2Sweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildCharter2();
  const existing = readCollection('charter2-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.ethicsline2Sig || 0) > 0)) {
    candidates.push({ key: 'ethics', level: 'alert', text: `Ethics open ${o.ethicsline2Sig || 0}`, domain: 'ethics' });
  }
  if (force || ((o.riskreg2Sig || 0) > 0 || (o.sanctions2Sig || 0) > 0)) {
    candidates.push({ key: 'compliance', level: 'warn', text: `Risk ${o.riskreg2Sig || 0} · Sanctions ${o.sanctions2Sig || 0}`, domain: 'compliance' });
  }
  if (force || ((o.claimdesk2Sig || 0) > 0 || (o.ipvault2Sig || 0) > 0)) {
    candidates.push({ key: 'legal', level: 'info', text: `Claims ${o.claimdesk2Sig || 0} · IP ${o.ipvault2Sig || 0}`, domain: 'legal' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Charter2 heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('c2f'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('charter2-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'THEMIS', title: `charter2 sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('c2s'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('charter2-sweeps', sweep, 80);
  appendAudit({ actor, action: 'charter2.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildCharter2() };
}

export function ackCharter2Flag(input = {}, actor = 'system') {
  const list = readCollection('charter2-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('charter2-flags', list);
  appendAudit({ actor, action: 'charter2.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildCharter2() };
}

export function closeCharter2Ethics(input = {}, actor = 'system') {
  const rows = listEthicsline2().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateEthicsline2(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createEthicsline2({ report: 'c2', severity: 'low', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'charter2.ethics_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildCharter2() };
}

export function liveCharter2Risk(input = {}, actor = 'system') {
  const rows = listRiskreg2().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRiskreg2(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createRiskreg2({ risk: 'c2', score: 40, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const s of listSanctions2().filter((x) => x.status === 'draft').slice(0, 5)) { updateSanctions2(s.id, { status: 'live', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'charter2.risk_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildCharter2() };
}

export function doneCharter2Claim(input = {}, actor = 'system') {
  const rows = listClaimdesk2().filter((x) => x.status === 'planned' || x.status === 'doing');
  const done = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateClaimdesk2(row.id, { status: 'done', touched_by: actor }, actor);
    if (next) done.push(next.id);
  }
  if (!done.length) {
    const seeded = createClaimdesk2({ claim: 'c2', amount: 1, status: 'done' }, actor);
    done.push(seeded.id);
  }
  for (const i of listIpvault2().filter((x) => x.status === 'open').slice(0, 5)) { updateIpvault2(i.id, { status: 'active', touched_by: actor }, actor); }
  for (const l of listLitigation2().filter((x) => x.status === 'idle').slice(0, 5)) { updateLitigation2(l.id, { status: 'busy', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'THEMIS', title: `charter2 claim_done · ${done.length}`, priority: 'normal', payload: { ids: done } }, actor);
  appendAudit({ actor, action: 'charter2.claim_done', detail: `${done.length}`, meta: { n: done.length } });
  return { ok: true, done, overview: buildCharter2() };
}
