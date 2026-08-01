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
  return {
    title: 'Kulüp & Sporcu OS',
    athletes,
    plans,
    summary: {
      active: athletes.filter((a) => a.status === 'active').length,
      licensed: athletes.filter((a) => a.license).length,
      trial: athletes.filter((a) => a.status === 'trial').length,
      plans_active: plans.filter((p) => p.status === 'active').length,
    },
    generatedAt: new Date().toISOString(),
  };
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
