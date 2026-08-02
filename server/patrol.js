import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 169 - Security patrol route ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('patrol', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'ptl_1',
      zone: "Sahil",
      note: "Normal",
      status: 'ok',
      checkpoint: 'Sahil-1',
      at: new Date().toISOString(),
    }];
    writeCollection('patrol', seed);
    return seed;
  }
  return list;
}

function openPatrolFlags() {
  const flags = readCollection('patrol-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addPatrolFlag(candidate, actor = 'system') {
  const existing = readCollection('patrol-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('ptf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('patrol-flags', list.slice(0, 200));
  return flag;
}

function hasMissedCheckpoint(row) {
  return row.status === 'missed' || row.status === 'missed_checkpoint' || row.missedCheckpoint === true;
}

export function listPatrol(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createPatrol(input = {}, actor = 'system') {
  const row = {
    id: rid('ptl'),
    zone: input.zone !== undefined ? input.zone : "Sahil",
    note: input.note !== undefined ? input.note : "Normal",
    checkpoint: input.checkpoint || input.checkpointName || null,
    routeName: input.routeName || input.route || null,
    guard: input.guard || null,
    dueAt: input.dueAt || null,
    status: input.status || 'ok',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('patrol', row, 300);
  appendAudit({
    actor,
    action: 'patrol.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePatrol(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('patrol', list);
  appendAudit({ actor, action: 'patrol.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function patrolSummary() {
  const list = listPatrol();
  const missedCheckpoints = list.filter(hasMissedCheckpoint);
  const completedRounds = list.filter((x) => x.status === 'complete' || x.status === 'completed' || x.completedAt);
  const nightRoutes = list.filter((x) => x.nightRoute === true || x.routeType === 'night');
  const flags = openPatrolFlags();
  return {
    title: 'LIKYA Patrol Ops',
    total: list.length,
    ok: list.filter((x) => x.status === 'ok').length,
    alert: list.filter((x) => x.status === 'alert').length,
    missed: list.filter((x) => x.status === 'missed').length,
    completed: completedRounds.length,
    missedCheckpoints: missedCheckpoints.length,
    nightRoutes: nightRoutes.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      ok: list.filter((x) => x.status === 'ok').length,
      alert: list.filter((x) => x.status === 'alert').length,
      missed: list.filter((x) => x.status === 'missed').length,
      completed: completedRounds.length,
      missed_checkpoints: missedCheckpoints.length,
      night_routes: nightRoutes.length,
    },
    summaryLines: [
      `Patrol ${list.length} round - missed checkpoint ${missedCheckpoints.length} - completed ${completedRounds.length}`,
      `Night routes ${nightRoutes.length} - alert ${list.filter((x) => x.status === 'alert').length} - flag ${flags.length}`,
    ],
    patrol: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runPatrolSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = patrolSummary();
  const created = [];
  const candidates = [];
  if (force || overview.missedCheckpoints > 0) {
    candidates.push({
      key: 'patrol_missed_checkpoint',
      level: overview.missedCheckpoints > 0 ? 'alert' : 'info',
      text: `Patrol missed checkpoints ${overview.missedCheckpoints}`,
      domain: 'checkpoint',
    });
  }
  if (force || overview.alert > 0) {
    candidates.push({
      key: 'patrol_alert_round',
      level: overview.alert > 0 ? 'warn' : 'info',
      text: `Patrol alerts ${overview.alert}`,
      domain: 'round',
    });
  }
  if (force || overview.nightRoutes > 0) {
    candidates.push({
      key: 'patrol_night_route',
      level: 'info',
      text: `Night routes ${overview.nightRoutes}`,
      domain: 'route',
    });
  }
  for (const candidate of candidates) {
    const flag = addPatrolFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `patrol sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('pts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('patrol-sweeps', sweep, 80);
  appendAudit({ actor, action: 'patrol.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: patrolSummary() };
}

export function ackPatrolFlag(input = {}, actor = 'system') {
  const list = readCollection('patrol-flags', []) || [];
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
  writeCollection('patrol-flags', list);
  appendAudit({ actor, action: 'patrol.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: patrolSummary() };
}

export function markPatrolMissedCheckpoint(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.checkpoint && x.checkpoint === input.checkpoint));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'ok' || x.status === 'alert');
  if (idx < 0) return { ok: false, error: 'Missed checkpoint yapilacak patrol yok' };
  list[idx] = {
    ...list[idx],
    status: 'missed',
    missedCheckpoint: true,
    checkpoint: input.checkpoint || list[idx].checkpoint || 'Checkpoint',
    missedAt: input.missedAt || new Date().toISOString(),
    missedBy: actor,
    dueAt: input.dueAt || new Date(Date.now() - 15 * 60_000).toISOString(),
    note: input.note || list[idx].note || 'Missed checkpoint',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('patrol', list);
  appendAudit({ actor, action: 'patrol.missed_checkpoint', detail: list[idx].checkpoint || list[idx].zone, meta: { id: list[idx].id } });
  return { ok: true, patrol: list[idx], overview: patrolSummary() };
}

export function completePatrolRound(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.routeName && x.routeName === input.routeName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'complete' && x.status !== 'completed');
  if (idx < 0) return { ok: false, error: 'Complete edilecek patrol round yok' };
  list[idx] = {
    ...list[idx],
    status: 'complete',
    missedCheckpoint: false,
    completedAt: input.completedAt || new Date().toISOString(),
    completedBy: actor,
    note: input.note || list[idx].note || 'Round complete',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('patrol', list);
  appendAudit({ actor, action: 'patrol.round_complete', detail: list[idx].routeName || list[idx].zone, meta: { id: list[idx].id } });
  return { ok: true, patrol: list[idx], overview: patrolSummary() };
}

export function seedNightRoute(input = {}, actor = 'system') {
  const patrol = createPatrol(
    {
      zone: input.zone || 'Night perimeter',
      note: input.note || 'Night route',
      checkpoint: input.checkpoint || 'N-01',
      routeName: input.routeName || input.route || 'Night route',
      guard: input.guard || 'Security',
      dueAt: input.dueAt || new Date(Date.now() + 60 * 60_000).toISOString(),
      status: input.status || 'ok',
    },
    actor,
  );
  updatePatrol(patrol.id, { nightRoute: true, routeType: 'night', checkpoints: Number(input.checkpoints ?? 8) || 8 }, actor);
  appendAudit({ actor, action: 'patrol.seed_night_route', detail: patrol.routeName || patrol.zone, meta: { id: patrol.id } });
  return {
    ok: true,
    patrol: { ...patrol, nightRoute: true, routeType: 'night', checkpoints: Number(input.checkpoints ?? 8) || 8 },
    overview: patrolSummary(),
  };
}
