/**
 * Wave 175 - Sustainability KPI ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('sustain-metrics', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'sus_1',
      metric: "plastic_kg",
      value: 12,
      status: 'tracking',
      at: new Date().toISOString(),
    }];
    writeCollection('sustain-metrics', seed);
    return seed;
  }
  return list;
}

function openSustainFlags() {
  const flags = readCollection('sustain-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addSustainFlag(candidate, actor = 'system') {
  const existing = readCollection('sustain-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('suf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('sustain-flags', list.slice(0, 200));
  return flag;
}

function isKpiMiss(row) {
  return row.kpiMiss === true || row.status === 'missed' || row.status === 'kpi_miss';
}

function hasActionLogged(row) {
  return row.actionLogged === true || row.action || row.status === 'action_logged';
}

function isGreenWeek(row) {
  return row.greenWeek === true || row.metric === 'green_week';
}

export function listSustain(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createSustain(input = {}, actor = 'system') {
  const row = {
    id: rid('sus'),
    metric: input.metric !== undefined ? input.metric : "plastic_kg",
    value: Number(input.value ?? "12") || 0,
    target: input.target !== undefined ? Number(input.target) || 0 : undefined,
    unit: input.unit !== undefined ? input.unit : undefined,
    action: input.action !== undefined ? input.action : undefined,
    greenWeek: input.greenWeek === true || undefined,
    status: input.status || 'tracking',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sustain-metrics', row, 300);
  appendAudit({
    actor,
    action: 'sustain.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateSustain(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.value !== undefined) next.value = Number(next.value) || 0;
  if (next.target !== undefined) next.target = Number(next.target) || 0;
  list[idx] = next;
  writeCollection('sustain-metrics', list);
  appendAudit({ actor, action: 'sustain.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function sustainSummary() {
  const list = listSustain();
  const kpiMisses = list.filter(isKpiMiss);
  const actionsLogged = list.filter(hasActionLogged);
  const greenWeeks = list.filter(isGreenWeek);
  const flags = openSustainFlags();
  return {
    title: 'LIKYA Sustainability Ops',
    total: list.length,
    tracking: list.filter((x) => x.status === 'tracking').length,
    missed: kpiMisses.length,
    actionLogged: actionsLogged.length,
    greenWeeks: greenWeeks.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      tracking: list.filter((x) => x.status === 'tracking').length,
      missed: kpiMisses.length,
      action_logged: actionsLogged.length,
      green_weeks: greenWeeks.length,
    },
    summaryLines: [
      `Sustain ${list.length} metric - KPI miss ${kpiMisses.length} - action ${actionsLogged.length}`,
      `Tracking ${list.filter((x) => x.status === 'tracking').length} - green week ${greenWeeks.length} - flag ${flags.length}`,
    ],
    entries: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runSustainSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = sustainSummary();
  const created = [];
  const candidates = [];
  if (force || overview.missed > 0) {
    candidates.push({
      key: 'sustain_kpi_miss',
      level: overview.missed > 0 ? 'warn' : 'info',
      text: `Sustain KPI misses ${overview.missed}`,
      domain: 'kpi',
    });
  }
  if (force || overview.actionLogged === 0) {
    candidates.push({
      key: 'sustain_action_log_needed',
      level: overview.actionLogged === 0 ? 'warn' : 'info',
      text: `Sustain actions logged ${overview.actionLogged}`,
      domain: 'action',
    });
  }
  if (force || overview.greenWeeks === 0) {
    candidates.push({
      key: 'sustain_green_week_seed',
      level: 'info',
      text: `Sustain green weeks ${overview.greenWeeks}`,
      domain: 'green_week',
    });
  }
  for (const candidate of candidates) {
    const flag = addSustainFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'GAIA-ESG',
      title: `sustain sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('sus'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('sustain-sweeps', sweep, 80);
  appendAudit({ actor, action: 'sustain.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: sustainSummary() };
}

export function ackSustainFlag(input = {}, actor = 'system') {
  const list = readCollection('sustain-flags', []) || [];
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
  writeCollection('sustain-flags', list);
  appendAudit({ actor, action: 'sustain.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: sustainSummary() };
}

export function markSustainKpiMiss(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.metric && x.metric === input.metric));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isKpiMiss(x));
  if (idx < 0) return { ok: false, error: 'KPI miss yapilacak sustain metric yok' };
  list[idx] = {
    ...list[idx],
    status: 'kpi_miss',
    kpiMiss: true,
    target: Number(input.target ?? list[idx].target ?? 10) || 10,
    value: Number(input.value ?? list[idx].value ?? 12) || 12,
    missReason: input.reason || input.missReason || 'above_target',
    missedAt: input.missedAt || new Date().toISOString(),
    missedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('sustain-metrics', list);
  appendAudit({ actor, action: 'sustain.kpi_miss', detail: list[idx].metric || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, metric: list[idx], overview: sustainSummary() };
}

export function logSustainAction(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.metric && x.metric === input.metric));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isKpiMiss(x) || !hasActionLogged(x));
  if (idx < 0) {
    const metric = createSustain({
      metric: input.metric || 'water_liters',
      value: input.value ?? 0,
      status: 'action_logged',
      action: input.action || 'Ops action logged',
    }, actor);
    return { ok: true, metric, overview: sustainSummary() };
  }
  list[idx] = {
    ...list[idx],
    status: 'action_logged',
    actionLogged: true,
    action: input.action || 'Ops action logged',
    actionOwner: input.owner || input.actionOwner || actor,
    actionAt: input.actionAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeCollection('sustain-metrics', list);
  appendAudit({ actor, action: 'sustain.action_log', detail: list[idx].metric || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, metric: list[idx], overview: sustainSummary() };
}

export function seedGreenWeek(input = {}, actor = 'system') {
  const metric = createSustain(
    {
      metric: 'green_week',
      value: input.value ?? 100,
      target: input.target ?? 95,
      unit: input.unit || 'score',
      status: input.status || 'tracking',
      greenWeek: true,
      action: input.action || 'Green week program seeded',
    },
    actor,
  );
  appendAudit({ actor, action: 'sustain.seed_green_week', detail: metric.metric, meta: { id: metric.id } });
  return { ok: true, metric, overview: sustainSummary() };
}
