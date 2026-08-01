/**
 * AŞAMA 90 — Board pack (digest + readiness + finance sinyalleri).
 */
import { buildDigest } from './digest.js';
import { buildReadiness } from './readiness.js';
import { buildOpsReport } from './report.js';
import { budgetSummary, createBudget, listBudget, updateBudget } from './budget.js';
import { contractsSummary, createContracts, listContracts, updateContracts } from './contracts.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildBoardpack() {
  const digest = buildDigest();
  const ready = buildReadiness();
  const report = buildOpsReport();
  const budget = budgetSummary();
  const contracts = contractsSummary();
  const flags = readCollection('boardpack-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const lines = listBudget();
  const overspend = lines.filter((l) => Number(l.actual || 0) > Number(l.planned || 0)).length;
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Board Pack',
    digest,
    readiness: { overall: ready.overall, grade: ready.grade, dimensions: ready.dimensions },
    ethos: report.ethos || report.scores || null,
    budgetTotal: budget.total,
    contractsTotal: contracts.total,
    renewing: contracts.renewing || 0,
    overspend,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      readiness: ready.overall,
      grade: ready.grade,
      renewing: contracts.renewing || 0,
      overspend,
      budget_total: budget.total,
    },
    summaryLines: [
      `Hazırlık ${ready.overall}/${ready.grade}`,
      ...(digest.headlines || []).slice(0, 3),
      `Bütçe kalemi ${budget.total} · overspend ${overspend}`,
      `Sözleşme ${contracts.total} (yenileme ${contracts.renewing || 0})`,
      `Board Pack flag ${openFlags.length} açık`,
    ],
  };
}

export function runBoardpackSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const b = buildBoardpack();
  const existing = readCollection('boardpack-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (b.renewing || 0) > 0) {
    candidates.push({ key: 'contracts_renewing', level: 'warn', text: `Sözleşme yenileme ${b.renewing || 0}`, domain: 'contracts' });
  }
  if (force || (b.overspend || 0) > 0) {
    candidates.push({ key: 'budget_overspend', level: 'alert', text: `Bütçe overspend ${b.overspend || 0}`, domain: 'budget' });
  }
  if (force || (b.readiness?.overall ?? 100) < 70) {
    candidates.push({
      key: 'readiness_gap',
      level: 'alert',
      text: `Hazırlık ${b.readiness?.overall ?? 0}/${b.readiness?.grade || '?'}`,
      domain: 'readiness',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Board Pack heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('bdf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('boardpack-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `boardpack sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('bps'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('boardpack-sweeps', sweep, 80);
  appendAudit({ actor, action: 'boardpack.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildBoardpack() };
}

export function ackBoardpackFlag(input = {}, actor = 'system') {
  const list = readCollection('boardpack-flags', []) || [];
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
  writeCollection('boardpack-flags', list);
  appendAudit({ actor, action: 'boardpack.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildBoardpack() };
}

export function snapshotBoardpack(input = {}, actor = 'system') {
  const overview = buildBoardpack();
  const snap = {
    id: rid('bpsnap'),
    at: new Date().toISOString(),
    actor,
    note: String(input.note || '').slice(0, 240) || undefined,
    readiness: overview.readiness,
    renewing: overview.renewing,
    overspend: overview.overspend,
    budgetTotal: overview.budgetTotal,
    summaryLines: (overview.summaryLines || []).slice(0, 6),
  };
  prependItem('boardpack-snapshots', snap, 60);
  appendAudit({ actor, action: 'boardpack.snapshot', detail: snap.id, meta: { id: snap.id } });
  return { ok: true, snapshot: snap, overview: buildBoardpack() };
}

export function renewBoardpackContract(input = {}, actor = 'system') {
  const active = listContracts().filter((c) => c.status === 'active' || c.status === 'renewing');
  const renewed = [];
  for (const c of active.slice(0, Number(input.limit) || 20)) {
    if (input.id && c.id !== input.id) continue;
    const nextStatus = c.status === 'renewing' ? 'active' : 'renewing';
    const next = updateContracts(c.id, { status: nextStatus, touched_by: actor }, actor);
    if (next) renewed.push(next.id);
  }
  if (!renewed.length) {
    const seeded = createContracts({ title: 'boardpack-renew', vendor: 'Board', status: 'renewing' }, actor);
    renewed.push(seeded.id);
  }
  appendAudit({ actor, action: 'boardpack.contract_renew', detail: `${renewed.length}`, meta: { n: renewed.length } });
  return { ok: true, renewed, overview: buildBoardpack() };
}

export function rebalanceBoardpackBudget(input = {}, actor = 'system') {
  const lines = listBudget();
  const over = lines.filter((l) => Number(l.actual || 0) > Number(l.planned || 0));
  const rebalanced = [];
  for (const l of over.slice(0, Number(input.limit) || 20)) {
    if (input.id && l.id !== input.id) continue;
    const planned = Number(l.planned || 0);
    const next = updateBudget(l.id, { actual: planned, rebalanced_by: actor }, actor);
    if (next) rebalanced.push(next.id);
  }
  if (!rebalanced.length) {
    const seeded = createBudget({ label: 'boardpack-rebalance', planned: 10000, actual: 10000, period: '2026-08' }, actor);
    rebalanced.push(seeded.id);
  }
  enqueueAgentJob(
    {
      agent: 'ETHOS',
      title: `boardpack budget rebalance · ${rebalanced.length}`,
      priority: 'high',
      payload: { ids: rebalanced },
    },
    actor,
  );
  appendAudit({ actor, action: 'boardpack.budget_rebalance', detail: `${rebalanced.length}`, meta: { n: rebalanced.length } });
  return { ok: true, rebalanced, overview: buildBoardpack() };
}
