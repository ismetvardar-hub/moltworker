import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 179 - Mystery shopper recovery ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('mystery-scores', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'mys_1',
      venueId: "venue_olympos_beach",
      score: 8,
      status: 'scored',
      at: new Date().toISOString(),
    }];
    writeCollection('mystery-scores', seed);
    return seed;
  }
  return list;
}

function openMysteryshopFlags() {
  const flags = readCollection('mysteryshop-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addMysteryshopFlag(candidate, actor = 'system') {
  const existing = readCollection('mysteryshop-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('mysf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('mysteryshop-flags', list.slice(0, 200));
  return flag;
}

function isLowScoreVisit(row) {
  return row.lowScore === true || row.status === 'low_score' || Number(row.score || 0) <= 6 || Boolean(row.lowScoreAt);
}

function isCoached(row) {
  return row.status === 'coached' || Boolean(row.coachAssignedAt) || Boolean(row.coach);
}

function isFollowUp(row) {
  return row.followUp === true || row.status === 'follow_up' || Boolean(row.followUpAt);
}

export function listMysteryshop(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createMysteryshop(input = {}, actor = 'system') {
  const row = {
    id: rid('mys'),
    venueId: input.venueId !== undefined ? input.venueId : "venue_olympos_beach",
    score: Number(input.score ?? "8") || 0,
    visitType: input.visitType || input.type || null,
    coach: input.coach || null,
    followUp: input.followUp === true || undefined,
    status: input.status || 'scored',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mystery-scores', row, 300);
  appendAudit({
    actor,
    action: 'mysteryshop.create',
    detail: String(row.title || row.venueId || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateMysteryshop(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.score !== undefined) next.score = Number(next.score) || 0;
  list[idx] = next;
  writeCollection('mystery-scores', list);
  appendAudit({ actor, action: 'mysteryshop.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function mysteryshopSummary() {
  const list = listMysteryshop();
  const lowScoreVisits = list.filter(isLowScoreVisit);
  const coached = list.filter(isCoached);
  const followUps = list.filter(isFollowUp);
  const flags = openMysteryshopFlags();
  return {
    title: 'LIKYA Mystery Shop Ops',
    total: list.length,
    scored: list.filter((x) => x.status === 'scored').length,
    lowScoreVisits: lowScoreVisits.length,
    coached: coached.length,
    followUps: followUps.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      scored: list.filter((x) => x.status === 'scored').length,
      low_score_visits: lowScoreVisits.length,
      coached: coached.length,
      follow_ups: followUps.length,
    },
    summaryLines: [
      `Mystery shop ${list.length} visit - low score ${lowScoreVisits.length} - coached ${coached.length}`,
      `Follow-ups ${followUps.length} - flags ${flags.length}`,
    ],
    scores: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runMysteryshopSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = mysteryshopSummary();
  const created = [];
  const candidates = [];
  if (force || overview.lowScoreVisits > 0) {
    candidates.push({
      key: 'mysteryshop_low_score_visit',
      level: overview.lowScoreVisits > 0 ? 'warn' : 'info',
      text: `Mystery shop low score visits ${overview.lowScoreVisits}`,
      domain: 'score',
    });
  }
  if (force || overview.lowScoreVisits > overview.coached) {
    candidates.push({
      key: 'mysteryshop_coach_assignment',
      level: overview.lowScoreVisits > overview.coached ? 'warn' : 'info',
      text: `Mystery shop coach assignments ${overview.coached}/${overview.lowScoreVisits}`,
      domain: 'coach',
    });
  }
  if (force || overview.followUps === 0) {
    candidates.push({
      key: 'mysteryshop_follow_up_seed',
      level: 'info',
      text: `Mystery shop follow-ups ${overview.followUps}`,
      domain: 'followup',
    });
  }
  for (const candidate of candidates) {
    const flag = addMysteryshopFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `mysteryshop sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('myss'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('mysteryshop-sweeps', sweep, 80);
  appendAudit({ actor, action: 'mysteryshop.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: mysteryshopSummary() };
}

export function ackMysteryshopFlag(input = {}, actor = 'system') {
  const list = readCollection('mysteryshop-flags', []) || [];
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
  writeCollection('mysteryshop-flags', list);
  appendAudit({ actor, action: 'mysteryshop.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: mysteryshopSummary() };
}

export function markMysteryshopLowScoreVisit(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.venueId && x.venueId === input.venueId));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isLowScoreVisit(x));
  if (idx < 0) return { ok: false, error: 'Low score yapilacak mystery shop ziyareti yok' };
  list[idx] = {
    ...list[idx],
    status: 'low_score',
    score: Number(input.score ?? list[idx].score ?? 5) || 5,
    lowScore: true,
    lowScoreReason: input.reason || input.lowScoreReason || 'service_recovery',
    lowScoreAt: input.lowScoreAt || new Date().toISOString(),
    lowScoreBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('mystery-scores', list);
  appendAudit({ actor, action: 'mysteryshop.low_score', detail: list[idx].venueId || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, visit: list[idx], overview: mysteryshopSummary() };
}

export function assignMysteryshopCoach(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.venueId && x.venueId === input.venueId));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isLowScoreVisit(x) && !isCoached(x));
  if (idx < 0) return { ok: false, error: 'Coach atanacak mystery shop ziyareti yok' };
  list[idx] = {
    ...list[idx],
    status: 'coached',
    coach: input.coach || input.coachName || 'Guest excellence coach',
    coachAssignedAt: input.coachAssignedAt || new Date().toISOString(),
    coachAssignedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('mystery-scores', list);
  appendAudit({ actor, action: 'mysteryshop.coach_assign', detail: list[idx].venueId || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, visit: list[idx], overview: mysteryshopSummary() };
}

export function seedMysteryshopFollowUp(input = {}, actor = 'system') {
  const visit = createMysteryshop(
    {
      venueId: input.venueId || 'venue_follow_up',
      score: Number(input.score ?? 7) || 7,
      visitType: input.visitType || 'follow_up',
      status: input.status || 'follow_up',
      followUp: true,
    },
    actor,
  );
  updateMysteryshop(visit.id, {
    followUpAt: input.followUpAt || new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    coach: input.coach || 'Guest excellence coach',
  }, actor);
  appendAudit({ actor, action: 'mysteryshop.seed_follow_up', detail: visit.venueId, meta: { id: visit.id } });
  return {
    ok: true,
    visit: { ...visit, followUpAt: input.followUpAt || new Date(Date.now() + 24 * 60 * 60_000).toISOString(), coach: input.coach || 'Guest excellence coach' },
    overview: mysteryshopSummary(),
  };
}
