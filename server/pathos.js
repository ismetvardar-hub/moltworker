/**
 * AŞAMA 1185 — Pathos checkpoint.
 */
import { buildLogos } from './logos.js';
import { createIpvault3, listIpvault3, ipvault3Summary, updateIpvault3 } from './ipvault3.js';
import { createRiskreg3, listRiskreg3, riskreg3Summary, updateRiskreg3 } from './riskreg3.js';
import { createClaimdesk3, listClaimdesk3, claimdesk3Summary, updateClaimdesk3 } from './claimdesk3.js';
import { createLitigation3, listLitigation3, litigation3Summary, updateLitigation3 } from './litigation3.js';
import { createEthicsline3, listEthicsline3, ethicsline3Summary, updateEthicsline3 } from './ethicsline3.js';
import { createSanctions3, listSanctions3, sanctions3Summary, updateSanctions3 } from './sanctions3.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildPathos() {
  const prev = buildLogos();
  const s0 = ipvault3Summary();
  const s1 = riskreg3Summary();
  const s2 = claimdesk3Summary();
  const s3 = litigation3Summary();
  const s4 = ethicsline3Summary();
  const s5 = sanctions3Summary();
  const flags = readCollection('pathos-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Pathos',
    logos: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    ipvault3Sig: s0.open || 0,
    riskreg3Sig: s1.draft || 0,
    claimdesk3Sig: s2.planned || 0,
    litigation3Sig: s3.idle || 0,
    ethicsline3Sig: s4.open || 0,
    sanctions3Sig: s5.draft || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      ip_open: s0.open || 0,
      risk_draft: s1.draft || 0,
      claim_planned: s2.planned || 0,
      lit_idle: s3.idle || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `IP Vault ${s0.open || 0} · Risk Reg ${s1.draft || 0}`,
      `Claim Desk ${s2.planned || 0} · Litigation ${s3.idle || 0}`,
      `Ethics Line ${s4.open || 0} · Sanctions ${s5.draft || 0}`,
      `Pathos flag ${openFlags.length} açık`,
    ],
  };
}

export function runPathosSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildPathos();
  const existing = readCollection('pathos-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.ipvault3Sig || 0) > 0 || (o.ethicsline3Sig || 0) > 0)) {
    candidates.push({ key: 'ip', level: 'alert', text: `IP open ${o.ipvault3Sig || 0} · Ethics ${o.ethicsline3Sig || 0}`, domain: 'ip' });
  }
  if (force || ((o.riskreg3Sig || 0) > 0 || (o.sanctions3Sig || 0) > 0)) {
    candidates.push({ key: 'risk', level: 'warn', text: `Risk draft ${o.riskreg3Sig || 0} · Sanctions ${o.sanctions3Sig || 0}`, domain: 'risk' });
  }
  if (force || ((o.claimdesk3Sig || 0) > 0 || (o.litigation3Sig || 0) > 0)) {
    candidates.push({ key: 'claim', level: 'info', text: `Claim planned ${o.claimdesk3Sig || 0} · Lit idle ${o.litigation3Sig || 0}`, domain: 'claim' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Pathos heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('patf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('pathos-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `pathos sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('pats'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('pathos-sweeps', sweep, 80);
  appendAudit({ actor, action: 'pathos.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildPathos() };
}

export function ackPathosFlag(input = {}, actor = 'system') {
  const list = readCollection('pathos-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('pathos-flags', list);
  appendAudit({ actor, action: 'pathos.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildPathos() };
}

export function closePathosIp(input = {}, actor = 'system') {
  const rows = listIpvault3().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateIpvault3(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createIpvault3({ asset: 'pathos', owner: 'ok', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const e of listEthicsline3().filter((x) => x.status === 'open' || x.status === 'active').slice(0, 5)) {
    updateEthicsline3(e.id, { status: 'closed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'pathos.ip_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildPathos() };
}

export function livePathosRisk(input = {}, actor = 'system') {
  const rows = listRiskreg3().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateRiskreg3(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createRiskreg3({ risk: 'pathos', score: '1', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const s of listSanctions3().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateSanctions3(s.id, { status: 'live', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'pathos.risk_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildPathos() };
}

export function runPathosClaim(input = {}, actor = 'system') {
  const rows = listClaimdesk3().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateClaimdesk3(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createClaimdesk3({ claim: 'pathos', amount: '1', status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const l of listLitigation3().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateLitigation3(l.id, { status: 'busy', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `pathos claim_run · ${ran.length}`, priority: 'normal', payload: { ids: ran } }, actor);
  appendAudit({ actor, action: 'pathos.claim_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildPathos() };
}
