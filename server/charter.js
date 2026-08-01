/**
 * AŞAMA 825 — Charter checkpoint.
 */
import { buildCrucible } from './crucible.js';
import { createIpvault, listIpvault, ipvaultSummary, updateIpvault } from './ipvault.js';
import { createRiskreg, listRiskreg, riskregSummary, updateRiskreg } from './riskreg.js';
import { createClaimdesk, listClaimdesk, claimdeskSummary, updateClaimdesk } from './claimdesk.js';
import { createLitigation, listLitigation, litigationSummary, updateLitigation } from './litigation.js';
import { createEthicsline, listEthicsline, ethicslineSummary, updateEthicsline } from './ethicsline.js';
import { createSanctions, listSanctions, sanctionsSummary, updateSanctions } from './sanctions.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildCharter() {
  const prev = buildCrucible();
  const s0 = ipvaultSummary();
  const s1 = riskregSummary();
  const s2 = claimdeskSummary();
  const s3 = litigationSummary();
  const s4 = ethicslineSummary();
  const s5 = sanctionsSummary();
  const flags = readCollection('charter-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Charter',
    crucible: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    ipvaultSig: s0.open || 0,
    riskregSig: s1.draft || 0,
    claimdeskSig: s2.planned || 0,
    litigationSig: s3.idle || 0,
    ethicslineSig: s4.open || 0,
    sanctionsSig: s5.draft || 0,
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
      `Charter flag ${openFlags.length} açık`,
    ],
  };
}

export function runCharterSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildCharter();
  const existing = readCollection('charter-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.ethicslineSig || 0) > 0)) {
    candidates.push({ key: 'ethics', level: 'alert', text: `Ethics open ${o.ethicslineSig || 0}`, domain: 'ethics' });
  }
  if (force || ((o.riskregSig || 0) > 0 || (o.sanctionsSig || 0) > 0)) {
    candidates.push({ key: 'compliance', level: 'warn', text: `Risk ${o.riskregSig || 0} · Sanctions ${o.sanctionsSig || 0}`, domain: 'compliance' });
  }
  if (force || ((o.claimdeskSig || 0) > 0 || (o.ipvaultSig || 0) > 0)) {
    candidates.push({ key: 'legal', level: 'info', text: `Claims ${o.claimdeskSig || 0} · IP ${o.ipvaultSig || 0}`, domain: 'legal' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Charter heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('chrf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('charter-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'THEMIS', title: `charter sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('chrs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('charter-sweeps', sweep, 80);
  appendAudit({ actor, action: 'charter.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildCharter() };
}

export function ackCharterFlag(input = {}, actor = 'system') {
  const list = readCollection('charter-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('charter-flags', list);
  appendAudit({ actor, action: 'charter.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildCharter() };
}

export function closeCharterEthics(input = {}, actor = 'system') {
  const rows = listEthicsline().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateEthicsline(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createEthicsline({ report: 'charter', severity: 'low', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'charter.ethics_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildCharter() };
}

export function liveCharterRisk(input = {}, actor = 'system') {
  const rows = listRiskreg().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRiskreg(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createRiskreg({ risk: 'charter', score: 40, status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const s of listSanctions().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateSanctions(s.id, { status: 'live', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'charter.risk_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildCharter() };
}

export function doneCharterClaim(input = {}, actor = 'system') {
  const rows = listClaimdesk().filter((x) => x.status === 'planned' || x.status === 'doing');
  const done = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateClaimdesk(row.id, { status: 'done', touched_by: actor }, actor);
    if (next) done.push(next.id);
  }
  if (!done.length) {
    const seeded = createClaimdesk({ claim: 'charter', amount: 1, status: 'done' }, actor);
    done.push(seeded.id);
  }
  for (const i of listIpvault().filter((x) => x.status === 'open').slice(0, 5)) {
    updateIpvault(i.id, { status: 'active', touched_by: actor }, actor);
  }
  for (const l of listLitigation().filter((x) => x.status === 'idle').slice(0, 5)) {
    updateLitigation(l.id, { status: 'busy', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'THEMIS', title: `charter claim_done · ${done.length}`, priority: 'normal', payload: { ids: done } }, actor);
  appendAudit({ actor, action: 'charter.claim_done', detail: `${done.length}`, meta: { n: done.length } });
  return { ok: true, done, overview: buildCharter() };
}
