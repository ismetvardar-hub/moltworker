/**
 * Adım 4 — Kulüp & sporcu OS: lisans, antrenman, gelişim.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';

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
  return {
    title: 'Kulüp & Sporcu OS',
    athletes,
    plans,
    sessions: (Array.isArray(sessions) ? sessions : []).slice(0, 30),
    readiness: readiness.athletes,
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
