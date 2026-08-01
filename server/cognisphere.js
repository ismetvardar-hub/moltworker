/**
 * AŞAMA 315 — Cognisphere checkpoint (brandpulse + AI/ajan ops sinyalleri).
 */
import { buildBrandpulse } from './brandpulse.js';
import { agentevalSummary } from './agenteval.js';
import { tokenbudgetSummary } from './tokenbudget.js';
import { createRedteam, listRedteam, redteamSummary, updateRedteam } from './redteam.js';
import { createHallucheck, hallucheckSummary, listHallucheck, updateHallucheck } from './hallucheck.js';
import { createCostguard, costguardSummary, listCostguard, updateCostguard } from './costguard.js';
import { createDriftmonitor, driftmonitorSummary, listDriftmonitor, updateDriftmonitor } from './driftmonitor.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildCognisphere() {
  const brand = buildBrandpulse();
  const evals = agentevalSummary();
  const tokens = tokenbudgetSummary();
  const red = redteamSummary();
  const hallu = hallucheckSummary();
  const cost = costguardSummary();
  const drift = driftmonitorSummary();
  const flags = readCollection('cognisphere-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Cognisphere',
    brandpulse: { summaryLines: (brand.summaryLines || []).slice(0, 2) },
    evalFailed: evals.failed || 0,
    tokenWarn: tokens.warn || 0,
    redOpen: red.open || 0,
    halluFlagged: hallu.flagged || 0,
    costHalt: cost.halt || 0,
    driftActive: drift.drift || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      flags_acked: flagList.filter((f) => f.status === 'acked').length,
      cost_halt: cost.halt || 0,
      drift_active: drift.drift || 0,
      red_open: red.open || 0,
      hallu_flagged: hallu.flagged || 0,
    },
    summaryLines: [
      ...(brand.summaryLines || []).slice(0, 2),
      `Ajan eval fail ${evals.failed || 0} · Token warn ${tokens.warn || 0}`,
      `Red-team açık ${red.open || 0} · Hallucination flagged ${hallu.flagged || 0}`,
      `Cost halt ${cost.halt || 0} · Drift ${drift.drift || 0}`,
      `Cognisphere flag ${openFlags.length} açık`,
    ],
  };
}

/** Alt sinyallerden cognisphere flag üret */
export function runCognisphereSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const cog = buildCognisphere();
  const existing = readCollection('cognisphere-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (cog.costHalt || 0) > 0) {
    candidates.push({
      key: 'cost_halt',
      level: 'alert',
      text: `Cost halt ${cog.costHalt || 0}`,
      domain: 'cost',
    });
  }
  if (force || (cog.driftActive || 0) > 0) {
    candidates.push({
      key: 'drift_active',
      level: 'warn',
      text: `Model drift ${cog.driftActive || 0}`,
      domain: 'drift',
    });
  }
  if (force || (cog.redOpen || 0) > 0) {
    candidates.push({
      key: 'red_open',
      level: 'alert',
      text: `Red-team açık ${cog.redOpen || 0}`,
      domain: 'redteam',
    });
  }
  if (force || (cog.halluFlagged || 0) > 0) {
    candidates.push({
      key: 'hallu_flagged',
      level: 'warn',
      text: `Hallucination flagged ${cog.halluFlagged || 0}`,
      domain: 'hallu',
    });
  }
  if (force || (cog.evalFailed || 0) > 0) {
    candidates.push({
      key: 'eval_failed',
      level: 'warn',
      text: `Ajan eval fail ${cog.evalFailed || 0}`,
      domain: 'eval',
    });
  }
  if (force && !candidates.length) {
    candidates.push({
      key: 'heartbeat',
      level: 'info',
      text: 'Cognisphere heartbeat OK',
      domain: 'system',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = {
      id: rid('cgf'),
      ...c,
      status: 'open',
      at: new Date().toISOString(),
      actor,
    };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('cognisphere-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `cognisphere sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = {
    id: rid('cgs'),
    created: created.length,
    ids: created.map((f) => f.id),
    at: new Date().toISOString(),
    actor,
  };
  prependItem('cognisphere-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'cognisphere.sweep',
    detail: `${created.length} flag`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, created, overview: buildCognisphere() };
}

export function ackCognisphereFlag(input = {}, actor = 'system') {
  const list = readCollection('cognisphere-flags', []) || [];
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
  writeCollection('cognisphere-flags', list);
  appendAudit({
    actor,
    action: 'cognisphere.ack',
    detail: list[idx].text,
    meta: { id: list[idx].id },
  });
  return { ok: true, flag: list[idx], overview: buildCognisphere() };
}

/** Cost guard halt — servis harcamasını durdur */
export function haltCognisphereCost(input = {}, actor = 'system') {
  const service = String(input.service || 'Ollama').slice(0, 80);
  let row = listCostguard().find((x) => String(x.service) === service);
  if (row) {
    row = updateCostguard(row.id, { status: 'halt', reason: input.reason || 'cognisphere halt' }, actor);
  } else {
    row = createCostguard({ service, spend: Number(input.spend) || 0, status: 'halt' }, actor);
  }
  const flag = {
    id: rid('cgf'),
    key: `cost_halt_${service}`,
    level: 'alert',
    text: `Cost halt · ${service}`,
    domain: 'cost',
    status: 'open',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('cognisphere-flags', flag, 200);
  enqueueAgentJob(
    {
      agent: 'PLUTUS',
      title: `cost halt · ${service}`,
      priority: 'high',
      payload: { service, cost_id: row?.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'cognisphere.cost_halt',
    detail: service,
    meta: { id: row?.id },
  });
  return { ok: true, cost: row, flag, overview: buildCognisphere() };
}

/** Drift kayıtlarını stable'a çek */
export function clearCognisphereDrift(input = {}, actor = 'system') {
  const list = listDriftmonitor();
  const cleared = [];
  for (const d of list) {
    if (d.status !== 'drift' && d.status !== 'retrain' && !input.force) continue;
    if (input.id && d.id !== input.id) continue;
    if (input.model && d.model !== input.model) continue;
    const next = updateDriftmonitor(d.id, { status: 'stable', cleared_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length && input.force) {
    const seeded = createDriftmonitor({ model: input.model || 'vision-ranker', delta: 0, status: 'stable' }, actor);
    cleared.push(seeded.id);
  }
  if (!cleared.length) return { ok: false, error: 'Temizlenecek drift yok' };
  const flags = readCollection('cognisphere-flags', []) || [];
  if (Array.isArray(flags)) {
    for (let i = 0; i < flags.length; i++) {
      if (flags[i].domain === 'drift' && flags[i].status === 'open') {
        flags[i] = {
          ...flags[i],
          status: 'acked',
          acked_at: new Date().toISOString(),
          acked_by: actor,
          note: 'drift cleared',
        };
      }
    }
    writeCollection('cognisphere-flags', flags);
  }
  appendAudit({
    actor,
    action: 'cognisphere.drift_clear',
    detail: `${cleared.length} model`,
    meta: { n: cleared.length },
  });
  return { ok: true, cleared, overview: buildCognisphere() };
}

/** Red-team / hallu açıklarını kapat (mitigate) */
export function mitigateCognisphereRisk(input = {}, actor = 'system') {
  const mitigated = [];
  const reds = listRedteam().filter((r) => r.status === 'open');
  for (const r of reds.slice(0, Number(input.limit) || 10)) {
    if (input.id && r.id !== input.id) continue;
    const next = updateRedteam(r.id, { status: 'mitigated', mitigated_by: actor }, actor);
    if (next) mitigated.push({ kind: 'redteam', id: next.id });
  }
  const halls = listHallucheck().filter((h) => h.status === 'flagged' || h.status === 'open');
  for (const h of halls.slice(0, Number(input.limit) || 10)) {
    if (input.id && h.id !== input.id) continue;
    const next = updateHallucheck(h.id, { status: 'cleared', cleared_by: actor }, actor);
    if (next) mitigated.push({ kind: 'hallu', id: next.id });
  }
  if (!mitigated.length) {
    const seeded = createRedteam(
      { suite: input.suite || 'cognisphere-mitigate-seed', status: 'mitigated' },
      actor,
    );
    createHallucheck({ sample: 'cognisphere-clear-seed', status: 'clean' }, actor);
    mitigated.push({ kind: 'redteam', id: seeded.id });
  }
  appendAudit({
    actor,
    action: 'cognisphere.mitigate',
    detail: `${mitigated.length} risk`,
    meta: { n: mitigated.length },
  });
  return { ok: true, mitigated, overview: buildCognisphere() };
}
