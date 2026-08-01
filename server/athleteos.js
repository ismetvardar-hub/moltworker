/**
 * Adım 4 — Kulüp & sporcu OS: lisans, antrenman, gelişim.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const RTP_STAGES = ['rest', 'mobility', 'light_training', 'controlled_training', 'cleared'];

function rid(p) { return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`; }

function ensureAthletes() {
  let list = readCollection('club-athletes', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'ath_1', name: 'Deniz Kaya', sport: 'MTB', license: 'TR-MTB-2201', level: 'U18', status: 'active', coach: 'Coach Arda' },
      { id: 'ath_2', name: 'Mira Ak', sport: 'Climbing', license: 'TR-CL-884', level: 'Senior', status: 'active', coach: 'Coach Ela' },
      { id: 'ath_3', name: 'Kaan Sur', sport: 'SUP', license: null, level: 'Amateur', status: 'trial', coach: 'Coach Can' },
    ];
    writeCollection('club-athletes', list);
  }
  return list;
}

function ensurePlans() {
  let list = readCollection('athlete-plans', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'ap_1', athlete_id: 'ath_1', week: '2026-W32', focus: 'Endurance', sessions: ['Salı tempo', 'Perşembe interval', 'Cmt uzun'], status: 'active' },
      { id: 'ap_2', athlete_id: 'ath_2', week: '2026-W32', focus: 'Power', sessions: ['Pzt kuvvet', 'Çar fingerboard'], status: 'active' },
    ];
    writeCollection('athlete-plans', list);
  }
  return list;
}

export function athleteOsOverview() {
  const athletes = ensureAthletes();
  const plans = ensurePlans();
  const sessions = readCollection('athlete-sessions', []) || [];
  const readiness = athleteReadinessRollup();
  const injuries = readCollection('athlete-injuries', []) || [];
  const injuryList = Array.isArray(injuries) ? injuries : [];
  const openInjuries = injuryList.filter((i) => i.status !== 'closed' && i.rtp_stage !== 'cleared');
  const rtpEvents = readCollection('athlete-rtp-events', []) || [];
  return {
    title: 'Kulüp & Sporcu OS',
    athletes,
    plans,
    sessions: (Array.isArray(sessions) ? sessions : []).slice(0, 30),
    readiness: readiness.athletes,
    injuries: injuryList.slice(0, 30),
    rtp_events: (Array.isArray(rtpEvents) ? rtpEvents : []).slice(0, 20),
    summary: {
      active: athletes.filter((a) => a.status === 'active').length,
      licensed: athletes.filter((a) => a.license).length,
      trial: athletes.filter((a) => a.status === 'trial').length,
      plans_active: plans.filter((p) => p.status === 'active').length,
      sessions_logged: Array.isArray(sessions) ? sessions.length : 0,
      avg_readiness: readiness.avg,
      license_expiring: athletes.filter((a) => a.license_expires && a.license_expires < new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10)).length,
      cleared: athletes.filter((a) => a.medical_clearance === 'cleared').length,
      clearance_gap: athletes.filter((a) => a.medical_clearance !== 'cleared').length,
      injured: athletes.filter((a) => a.status === 'injured' || a.status === 'hold').length,
      open_injuries: openInjuries.length,
      rtp_in_progress: openInjuries.filter((i) => i.rtp_stage && i.rtp_stage !== 'rest').length,
    },
    generatedAt: new Date().toISOString(),
  };
}

/** Lisans ver / yenile → trial → active */
export function issueAthleteLicense(input = {}, actor = 'system') {
  const athletes = ensureAthletes();
  const idx = athletes.findIndex((a) => a.id === input.athlete_id || a.name === input.athlete_id);
  if (idx < 0) return { ok: false, error: 'Sporcu yok' };
  const sport = (athletes[idx].sport || 'GEN').slice(0, 3).toUpperCase();
  const code = input.license || athletes[idx].license || `TR-${sport}-${randomBytes(2).toString('hex').toUpperCase()}`;
  const expires = input.expires || new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
  athletes[idx] = {
    ...athletes[idx],
    license: code,
    license_expires: expires,
    status: athletes[idx].status === 'trial' ? 'active' : athletes[idx].status || 'active',
    licensed_at: new Date().toISOString(),
    licensed_by: actor,
  };
  writeCollection('club-athletes', athletes);
  appendAudit({
    actor,
    action: 'athlete.license',
    detail: `${athletes[idx].name} · ${code}`,
    meta: { id: athletes[idx].id, expires },
  });
  return { ok: true, athlete: athletes[idx], overview: athleteOsOverview() };
}

/** Seans RPE + yaşam recovery birleşik readiness */
export function athleteReadinessRollup(actor = 'system') {
  const athletes = ensureAthletes();
  const sessions = readCollection('athlete-sessions', []) || [];
  let lifeMetrics = [];
  try {
    lifeMetrics = readCollection('life-metrics', []) || [];
  } catch {
    lifeMetrics = [];
  }
  let lifeClients = [];
  try {
    lifeClients = readCollection('life-clients', []) || [];
  } catch {
    lifeClients = [];
  }
  const rows = athletes.map((a) => {
    const recent = (Array.isArray(sessions) ? sessions : []).filter((s) => s.athlete_id === a.id).slice(0, 5);
    const avgRpe = recent.length
      ? recent.reduce((s, x) => s + (Number(x.rpe) || 0), 0) / recent.length
      : null;
    const client = (Array.isArray(lifeClients) ? lifeClients : []).find((c) => c.athlete_id === a.id);
    const metric = client
      ? (Array.isArray(lifeMetrics) ? lifeMetrics : []).find((m) => m.client_id === client.id)
      : null;
    const recovery = metric ? Number(metric.recovery) : null;
    // readiness: recovery ağırlıklı, yüksek RPE düşürür
    let score = 70;
    if (recovery != null) score = recovery;
    if (avgRpe != null) score = Math.round(score * 0.7 + (100 - avgRpe * 8) * 0.3);
    score = Math.max(0, Math.min(100, score));
    return {
      athlete_id: a.id,
      name: a.name,
      license: a.license,
      avg_rpe: avgRpe != null ? Math.round(avgRpe * 10) / 10 : null,
      recovery,
      sessions_n: recent.length,
      score,
      flag: score < 55 ? 'watch' : score < 70 ? 'monitor' : 'ok',
    };
  });
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : null;
  return { ok: true, athletes: rows, avg, at: new Date().toISOString(), actor };
}

export function upsertAthletePlan(input = {}, actor = 'system') {
  const plans = ensurePlans();
  const row = {
    id: input.id || rid('ap'),
    athlete_id: input.athlete_id || 'ath_1',
    week: input.week || '2026-W32',
    focus: input.focus || 'Recovery',
    sessions: Array.isArray(input.sessions) ? input.sessions : String(input.sessions || 'Dinlenme').split(',').map((s) => s.trim()),
    status: input.status || 'active',
    at: new Date().toISOString(),
    actor,
  };
  const idx = plans.findIndex((p) => p.id === row.id);
  if (idx >= 0) plans[idx] = { ...plans[idx], ...row };
  else plans.unshift(row);
  writeCollection('athlete-plans', plans.slice(0, 300));
  appendAudit({ actor, action: 'athlete.plan', detail: `${row.athlete_id} · ${row.focus}`, meta: { id: row.id } });
  return { ok: true, plan: row, overview: athleteOsOverview() };
}

export function logAthleteSession(input = {}, actor = 'system') {
  const row = {
    id: rid('as'),
    athlete_id: input.athlete_id || 'ath_1',
    session: input.session || 'Antrenman',
    rpe: Number(input.rpe) || 6,
    notes: input.notes || '',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('athlete-sessions', row, 400);
  appendAudit({ actor, action: 'athlete.session', detail: `${row.athlete_id} RPE${row.rpe}`, meta: { id: row.id } });
  return { ok: true, session: row };
}

/** Tıbbi / waiver clearance — extreme + life köprüsü için */
export function setAthleteClearance(input = {}, actor = 'system') {
  const athletes = ensureAthletes();
  const idx = athletes.findIndex((a) => a.id === input.athlete_id || a.name === input.athlete_id);
  if (idx < 0) return { ok: false, error: 'Sporcu yok' };
  const status = input.status || 'cleared';
  const until =
    input.until || new Date(Date.now() + 180 * 864e5).toISOString().slice(0, 10);
  athletes[idx] = {
    ...athletes[idx],
    medical_clearance: status,
    clearance_until: until,
    clearance_note: input.note || '',
    cleared_at: new Date().toISOString(),
    cleared_by: actor,
  };
  writeCollection('club-athletes', athletes);
  const row = {
    id: rid('aclr'),
    athlete_id: athletes[idx].id,
    status,
    until,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('athlete-clearances', row, 200);
  appendAudit({
    actor,
    action: 'athlete.clearance',
    detail: `${athletes[idx].name} · ${status}`,
    meta: { id: row.id },
  });
  return { ok: true, athlete: athletes[idx], clearance: row, overview: athleteOsOverview() };
}

/** Sakatlık bildirimi → hold/injured + LIFE-COACH-AI */
export function reportAthleteInjury(input = {}, actor = 'system') {
  const athletes = ensureAthletes();
  const idx = athletes.findIndex((a) => a.id === input.athlete_id || a.name === input.athlete_id);
  if (idx < 0) return { ok: false, error: 'Sporcu yok' };
  const severity = input.severity || 'moderate';
  const injury = {
    id: rid('ainj'),
    athlete_id: athletes[idx].id,
    athlete_name: athletes[idx].name,
    sport: athletes[idx].sport,
    body_area: input.body_area || input.area || 'diz',
    severity,
    note: input.note || '',
    status: 'open',
    rtp_stage: 'rest',
    at: input.date || new Date().toISOString(),
    actor,
  };
  prependItem('athlete-injuries', injury, 300);
  athletes[idx] = {
    ...athletes[idx],
    status: severity === 'mild' ? 'hold' : 'injured',
    injury_id: injury.id,
    rtp_stage: 'rest',
    medical_clearance: severity === 'mild' ? athletes[idx].medical_clearance : 'hold',
  };
  writeCollection('club-athletes', athletes);
  enqueueAgentJob(
    {
      agent: 'LIFE-COACH-AI',
      title: `injury · ${athletes[idx].name} · ${injury.body_area} (${severity})`,
      priority: severity === 'severe' ? 'high' : 'normal',
      payload: { injury_id: injury.id, athlete_id: athletes[idx].id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'athlete.injury',
    detail: `${athletes[idx].name} · ${injury.body_area}`,
    meta: { id: injury.id },
  });
  return { ok: true, injury, athlete: athletes[idx], overview: athleteOsOverview() };
}

/** RTP aşaması ilerlet — readiness + clearance gate */
export function advanceReturnToPlay(input = {}, actor = 'system') {
  const injuries = readCollection('athlete-injuries', []) || [];
  const list = Array.isArray(injuries) ? [...injuries] : [];
  let idx = list.findIndex((i) => i.id === input.injury_id && i.status === 'open');
  if (idx < 0) idx = list.findIndex((i) => i.athlete_id === input.athlete_id && i.status === 'open');
  if (idx < 0) idx = list.findIndex((i) => i.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık sakatlık yok' };
  const injury = list[idx];
  const cur = injury.rtp_stage || 'rest';
  const curPos = RTP_STAGES.indexOf(cur);
  const target = input.stage || RTP_STAGES[Math.min(curPos + 1, RTP_STAGES.length - 1)];
  const targetPos = RTP_STAGES.indexOf(target);
  if (targetPos < 0) return { ok: false, error: 'Geçersiz RTP aşaması' };
  if (targetPos < curPos && !input.allow_regress) return { ok: false, error: 'Geri adım için allow_regress' };

  const athletes = ensureAthletes();
  const aidx = athletes.findIndex((a) => a.id === injury.athlete_id);
  const readiness = athleteReadinessRollup();
  const score = readiness.athletes?.find((r) => r.athlete_id === injury.athlete_id)?.score ?? 60;
  const medical = aidx >= 0 ? athletes[aidx].medical_clearance : null;

  if (targetPos >= RTP_STAGES.indexOf('light_training') && score < (Number(input.min_readiness) || 55) && !input.force) {
    return { ok: false, error: `Readiness düşük (${score})` };
  }
  if (target === 'cleared' && medical !== 'cleared' && !input.force) {
    return { ok: false, error: 'Tıbbi clearance gerekli' };
  }

  list[idx] = {
    ...injury,
    rtp_stage: target,
    status: target === 'cleared' ? 'closed' : 'open',
    updated_at: new Date().toISOString(),
  };
  writeCollection('athlete-injuries', list);
  if (aidx >= 0) {
    athletes[aidx] = {
      ...athletes[aidx],
      rtp_stage: target,
      status: target === 'cleared' ? 'active' : athletes[aidx].status,
      injury_id: target === 'cleared' ? null : injury.id,
    };
    writeCollection('club-athletes', athletes);
  }
  const event = {
    id: rid('artp'),
    injury_id: injury.id,
    athlete_id: injury.athlete_id,
    from: cur,
    to: target,
    readiness: score,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('athlete-rtp-events', event, 300);
  enqueueAgentJob(
    {
      agent: 'LIFE-COACH-AI',
      title: `RTP ${cur}→${target} · ${injury.athlete_name || injury.athlete_id}`,
      priority: 'normal',
      payload: { event_id: event.id, injury_id: injury.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'athlete.rtp',
    detail: `${injury.athlete_id} ${cur}→${target}`,
    meta: { id: event.id },
  });
  return { ok: true, injury: list[idx], event, overview: athleteOsOverview() };
}

/** Takılı / yüksek risk RTP taraması */
export function runAthleteRtpSweep(input = {}, actor = 'system') {
  const injuries = readCollection('athlete-injuries', []) || [];
  const open = (Array.isArray(injuries) ? injuries : []).filter((i) => i.status === 'open');
  const staleDays = Number(input.stale_days) || 7;
  const cutoff = Date.now() - staleDays * 864e5;
  const readiness = athleteReadinessRollup();
  const flagged = [];
  for (const inj of open) {
    const score = readiness.athletes?.find((r) => r.athlete_id === inj.athlete_id)?.score ?? null;
    const updated = inj.updated_at || inj.at;
    const stale = updated && new Date(updated).getTime() < cutoff;
    const highRisk = inj.severity === 'severe' || (score != null && score < 50);
    if (!stale && !highRisk && !input.force) continue;
    const reason = highRisk ? 'high_risk' : 'stale';
    flagged.push({ ...inj, reason, readiness: score });
    enqueueAgentJob(
      {
        agent: 'LIFE-COACH-AI',
        title: `RTP sweep · ${reason} · ${inj.athlete_name || inj.athlete_id}`,
        priority: highRisk ? 'high' : 'normal',
        payload: { injury_id: inj.id, reason },
      },
      actor,
    );
  }
  const sweep = {
    id: rid('arts'),
    open: open.length,
    flagged: flagged.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('athlete-rtp-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'athlete.rtp_sweep',
    detail: `${sweep.flagged}/${sweep.open}`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, flagged, overview: athleteOsOverview() };
}
