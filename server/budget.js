/**
 * Wave 165 - Budget line ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('budget-lines', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'bud_1',
        label: 'Kitchen supplies',
        planned: 120000,
        actual: 45000,
        forecast: 118000,
        period: '2026-08',
        status: 'active',
        at: new Date().toISOString(),
      },
    ];
    writeCollection('budget-lines', seed);
    return seed;
  }
  return list;
}

function openBudgetFlags() {
  const flags = readCollection('budget-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addBudgetFlag(candidate, actor = 'system') {
  const existing = readCollection('budget-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('buf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('budget-flags', list.slice(0, 200));
  return flag;
}

function isOverspendLine(row) {
  return row.status === 'overspend' || Number(row.actual || 0) > Number(row.planned || 0);
}

function isForecastGap(row) {
  return row.status === 'forecast_gap' || Number(row.forecast || 0) < Number(row.planned || 0) * 0.9;
}

export function listBudget(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createBudget(input = {}, actor = 'system') {
  const row = {
    id: `bud_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    label: input.label !== undefined ? input.label : 'New line',
    planned: input.planned !== undefined ? Number(input.planned) || 0 : 10000,
    actual: input.actual !== undefined ? Number(input.actual) || 0 : 0,
    forecast: input.forecast !== undefined ? Number(input.forecast) || 0 : Number(input.planned ?? 10000) || 10000,
    period: input.period || '2026-08',
    owner: input.owner || null,
    adjustment: input.adjustment !== undefined ? Number(input.adjustment) || 0 : 0,
    status: input.status || 'active',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('budget-lines', row, 300);
  appendAudit({ actor, action: 'budget.create', detail: String(row.label || row.id), meta: { id: row.id } });
  return row;
}

export function updateBudget(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  for (const key of ['planned', 'actual', 'forecast', 'adjustment']) {
    if (next[key] !== undefined) next[key] = Number(next[key]) || 0;
  }
  list[idx] = next;
  writeCollection('budget-lines', list);
  appendAudit({ actor, action: 'budget.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function budgetSummary() {
  const list = listBudget();
  const overspend = list.filter(isOverspendLine);
  const forecastGap = list.filter(isForecastGap);
  const pendingAdjustments = list.filter((x) => x.status === 'adjustment_pending' || Number(x.adjustment || 0) !== 0);
  const planned = list.reduce((sum, x) => sum + Number(x.planned || 0), 0);
  const actual = list.reduce((sum, x) => sum + Number(x.actual || 0), 0);
  const forecast = list.reduce((sum, x) => sum + Number(x.forecast || 0), 0);
  const flags = openBudgetFlags();
  return {
    title: 'LIKYA Budget Ops',
    total: list.length,
    planned,
    actual,
    forecast,
    variance: planned - actual,
    overspend: overspend.length,
    forecastGap: forecastGap.length,
    pendingAdjustments: pendingAdjustments.length,
    approved: list.filter((x) => x.status === 'approved').length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      planned,
      actual,
      forecast,
      overspend: overspend.length,
      forecast_gap: forecastGap.length,
      pending_adjustments: pendingAdjustments.length,
    },
    summaryLines: [
      `Budget ${list.length} line - planned ${planned} - actual ${actual}`,
      `Overspend ${overspend.length} - forecast gap ${forecastGap.length} - flag ${flags.length}`,
    ],
    lines: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runBudgetSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = budgetSummary();
  const created = [];
  const candidates = [];
  if (force || overview.overspend > 0) {
    candidates.push({
      key: 'budget_overspend_line',
      level: overview.overspend > 0 ? 'alert' : 'info',
      text: `Overspend budget line ${overview.overspend}`,
      domain: 'overspend',
    });
  }
  if (force || overview.pendingAdjustments > 0) {
    candidates.push({
      key: 'budget_adjustment_pending',
      level: overview.pendingAdjustments > 0 ? 'warn' : 'info',
      text: `Pending budget adjustment ${overview.pendingAdjustments}`,
      domain: 'adjustment',
    });
  }
  if (force || overview.forecastGap > 0) {
    candidates.push({
      key: 'budget_forecast_gap',
      level: overview.forecastGap > 0 ? 'warn' : 'info',
      text: `Forecast budget gap ${overview.forecastGap}`,
      domain: 'forecast',
    });
  }
  for (const candidate of candidates) {
    const flag = addBudgetFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'PLUTUS',
      title: `budget sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('bus'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('budget-sweeps', sweep, 80);
  appendAudit({ actor, action: 'budget.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: budgetSummary() };
}

export function ackBudgetFlag(input = {}, actor = 'system') {
  const list = readCollection('budget-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('budget-flags', list);
  appendAudit({ actor, action: 'budget.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: budgetSummary() };
}

export function flagBudgetOverspendLine(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'approved');
  if (idx < 0) return { ok: false, error: 'Overspend yapilacak budget line yok' };
  const planned = Number(input.planned ?? list[idx].planned ?? 10000) || 10000;
  const actual = Number(input.actual ?? Math.ceil(planned * 1.18)) || Math.ceil(planned * 1.18);
  list[idx] = {
    ...list[idx],
    planned,
    actual,
    status: 'overspend',
    overspendReason: input.reason || input.overspendReason || 'Ops overspend line',
    flaggedAt: input.flaggedAt || new Date().toISOString(),
    flaggedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('budget-lines', list);
  appendAudit({ actor, action: 'budget.overspend_line', detail: list[idx].label || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, line: list[idx], overview: budgetSummary() };
}

export function approveBudgetAdjustment(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'overspend' || x.status === 'adjustment_pending' || Number(x.adjustment || 0) !== 0);
  if (idx < 0) return { ok: false, error: 'Approve edilecek budget adjustment yok' };
  const adjustment = Number(input.adjustment ?? list[idx].adjustment ?? Math.max(0, Number(list[idx].actual || 0) - Number(list[idx].planned || 0))) || 0;
  list[idx] = {
    ...list[idx],
    adjustment,
    planned: Number(list[idx].planned || 0) + adjustment,
    status: 'approved',
    approvedAt: input.approvedAt || new Date().toISOString(),
    approvedBy: actor,
    approvalNote: input.note || input.approvalNote || 'Adjustment approved by ops',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('budget-lines', list);
  appendAudit({ actor, action: 'budget.adjustment_approve', detail: list[idx].label || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, line: list[idx], overview: budgetSummary() };
}

export function seedForecastBudgetGap(input = {}, actor = 'system') {
  const planned = Number(input.planned ?? 50000) || 50000;
  const forecast = Number(input.forecast ?? Math.floor(planned * 0.62)) || Math.floor(planned * 0.62);
  const line = createBudget(
    {
      label: input.label || 'Forecast gap line',
      planned,
      actual: Number(input.actual ?? 0),
      forecast,
      period: input.period || '2026-08',
      owner: input.owner || 'Finance ops',
      status: 'forecast_gap',
    },
    actor,
  );
  appendAudit({ actor, action: 'budget.seed_forecast_gap', detail: line.label, meta: { id: line.id } });
  return { ok: true, line, overview: budgetSummary() };
}
