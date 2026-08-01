/**
 * Spor köprüsü — Extreme Park ↔ Athlete OS tek nabız.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { extremeOverview } from './extremepark.js';
import { athleteOsOverview, athleteReadinessRollup, logAthleteSession, upsertAthletePlan } from './athleteos.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensureLinks() {
  let list = readCollection('sport-links', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'sl_1', extreme_user: 'guest_can', athlete_id: 'ath_1', sport: 'MTB', note: 'Can → Deniz köprü seed' },
      { id: 'sl_2', extreme_user: 'guest_ela', athlete_id: 'ath_2', sport: 'Climbing', note: 'Ela → Mira' },
    ];
    writeCollection('sport-links', list);
  }
  return list;
}

function matchLinks(extreme, athletes) {
  const links = ensureLinks();
  const enriched = links.map((l) => {
    const member = extreme.members?.find((m) => m.user_profile?.user_id === l.extreme_user || m.id === l.extreme_user);
    const athlete = athletes.athletes?.find((a) => a.id === l.athlete_id);
    const clearance = athlete?.medical_clearance || null;
    const injured = athlete?.status === 'injured' || athlete?.status === 'hold';
    return {
      ...l,
      member_name: member?.user_profile?.display_name || l.extreme_user,
      athlete_name: athlete?.name || l.athlete_id,
      waiver_ok: !!member?.user_profile?.waiver_signed,
      segment: member?.user_profile?.segment || null,
      license: athlete?.license || null,
      medical_clearance: clearance,
      clearance_ok: clearance === 'cleared',
      athlete_status: athlete?.status || null,
      rtp_stage: athlete?.rtp_stage || null,
      injured,
      weekly_used: member?.quota_management?.weekly_used ?? null,
    };
  });
  return enriched;
}

export function sportBridgeOverview() {
  const extreme = extremeOverview();
  const athletes = athleteOsOverview();
  const links = matchLinks(extreme, athletes);
  const gates = readCollection('sport-gate-checks', []) || [];
  return {
    title: 'Spor Köprüsü',
    ethos: 'Park slotu → kulüp seansı · waiver → lisans · ETHOS güler.',
    links,
    extreme: {
      open_slots: extreme.summary?.open_slots,
      waiver_pending: extreme.summary?.waiver_pending,
      members: (extreme.members || []).length,
    },
    club: athletes.summary,
    slots: (extreme.slots || []).slice(0, 12),
    gate_checks: (Array.isArray(gates) ? gates : []).slice(0, 20),
    summary: {
      linked: links.length,
      waiver_gaps: links.filter((l) => !l.waiver_ok).length,
      licensed_links: links.filter((l) => l.license).length,
      clearance_gaps: links.filter((l) => !l.clearance_ok).length,
      injured_links: links.filter((l) => l.injured).length,
      gate_blocks: (Array.isArray(gates) ? gates : []).filter((g) => g.status === 'blocked').length,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function linkSportProfiles(input = {}, actor = 'system') {
  const links = ensureLinks();
  const row = {
    id: rid('sl'),
    extreme_user: input.extreme_user || 'guest_can',
    athlete_id: input.athlete_id || 'ath_1',
    sport: input.sport || 'Trail',
    note: input.note || 'manuel köprü',
    at: new Date().toISOString(),
    actor,
  };
  links.unshift(row);
  writeCollection('sport-links', links.slice(0, 200));
  appendAudit({ actor, action: 'sport.link', detail: `${row.extreme_user} ↔ ${row.athlete_id}`, meta: { id: row.id } });
  return { ok: true, link: row, overview: sportBridgeOverview() };
}

/** Slot / seans öncesi waiver+lisans+clearance+injury kapısı */
export function gateSportSlotAccess(input = {}, actor = 'system') {
  const overview = sportBridgeOverview();
  const links = overview.links || [];
  const link =
    links.find((l) => l.id === input.link_id) ||
    links.find((l) => l.extreme_user === input.extreme_user) ||
    links.find((l) => l.athlete_id === input.athlete_id) ||
    links[0];
  if (!link) return { ok: false, error: 'Köprü yok', status: 'blocked' };
  const issues = [];
  if (!link.waiver_ok) issues.push('waiver');
  if (!link.license) issues.push('license');
  if (!link.clearance_ok) issues.push('clearance');
  if (link.injured) issues.push('injury');
  if (link.rtp_stage && link.rtp_stage !== 'cleared') issues.push('rtp');
  const ready = athleteReadinessRollup(actor);
  const score = ready.athletes?.find((r) => r.athlete_id === link.athlete_id)?.score ?? null;
  if (score != null && score < (Number(input.min_readiness) || 50)) issues.push('readiness');
  const status = issues.length ? 'blocked' : 'allowed';
  const row = {
    id: rid('sg'),
    link_id: link.id,
    extreme_user: link.extreme_user,
    athlete_id: link.athlete_id,
    issues,
    readiness: score,
    status,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('sport-gate-checks', row, 300);
  if (status === 'blocked') {
    let agent = 'SPORT-BRIDGE';
    if (issues.includes('clearance') || issues.includes('injury') || issues.includes('rtp')) agent = 'LIFE-COACH-AI';
    else if (issues.includes('waiver')) agent = 'DAZE-VISION';
    enqueueAgentJob(
      {
        agent,
        title: `sport gate block · ${link.athlete_name || link.athlete_id} · ${issues.join('+')}`,
        priority: 'high',
        payload: { gate_id: row.id, issues },
      },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'sport.gate',
    detail: `${link.athlete_id} · ${status}${issues.length ? ` · ${issues.join('+')}` : ''}`,
    meta: { id: row.id },
  });
  return {
    ok: status === 'allowed' || !!input.force,
    status,
    issues,
    gate: row,
    link,
    overview: sportBridgeOverview(),
    error: status === 'blocked' && !input.force ? `Kapı: ${issues.join(', ')}` : undefined,
  };
}

/** Extreme slot tamamlanınca athlete session yaz */
export function syncSlotToSession(input = {}, actor = 'system') {
  const extreme = extremeOverview();
  const slot = (extreme.slots || []).find((s) => s.id === input.slot_id) || (extreme.slots || [])[0];
  if (!slot) return { ok: false, error: 'Slot yok' };
  const links = ensureLinks();
  const userId = input.extreme_user || slot.user_id || links[0]?.extreme_user;
  const link = links.find((l) => l.extreme_user === userId) || links[0];
  if (!link) return { ok: false, error: 'Köprü yok — önce link' };
  if (!input.skip_gate) {
    const gate = gateSportSlotAccess(
      { extreme_user: link.extreme_user, athlete_id: link.athlete_id, force: input.force },
      actor,
    );
    if (!gate.ok) return { ok: false, error: gate.error || 'Sport gate blocked', gate };
  }
  const session = logAthleteSession(
    {
      athlete_id: link.athlete_id,
      session: `${slot.branch || slot.title || 'extreme'} slot`,
      rpe: Number(input.rpe) || 7,
      notes: `bridge:${slot.id || 'slot'}`,
    },
    actor,
  );
  prependItem(
    'sport-syncs',
    {
      id: rid('ss'),
      slot_id: slot.id,
      athlete_id: link.athlete_id,
      extreme_user: link.extreme_user,
      at: new Date().toISOString(),
    },
    200,
  );
  appendAudit({
    actor,
    action: 'sport.sync_slot',
    detail: `${link.extreme_user} → ${link.athlete_id}`,
    meta: { slot_id: slot.id, athlete_id: link.athlete_id },
  });
  return { ok: true, session: session.session, overview: sportBridgeOverview() };
}

export function bridgeRecoveryPlan(input = {}, actor = 'system') {
  const links = ensureLinks();
  const link = links.find((l) => l.athlete_id === input.athlete_id) || links[0];
  if (!link) return { ok: false, error: 'Köprü yok' };
  const plan = upsertAthletePlan(
    {
      athlete_id: link.athlete_id,
      focus: 'Recovery',
      sessions: 'Hafif tempo, mobilite, nefes',
      week: input.week || '2026-W32',
    },
    actor,
  );
  return { ok: true, plan: plan.plan, overview: sportBridgeOverview() };
}

/** Waiver / lisans / kota / readiness tarama → ajan kuyruk */
export function runSportEligibilitySweep(input = {}, actor = 'system') {
  const overview = sportBridgeOverview();
  const ready = athleteReadinessRollup(actor);
  const byAthlete = Object.fromEntries((ready.athletes || []).map((r) => [r.athlete_id, r]));
  const flags = [];
  const jobs = [];
  for (const link of overview.links || []) {
    const issues = [];
    if (!link.waiver_ok) issues.push('waiver');
    if (!link.license) issues.push('license');
    if (!link.clearance_ok) issues.push('clearance');
    if (link.injured) issues.push('injury');
    if (link.rtp_stage && link.rtp_stage !== 'cleared') issues.push('rtp');
    const weekly = Number(link.weekly_used);
    if (Number.isFinite(weekly) && weekly >= 5) issues.push('quota');
    const r = byAthlete[link.athlete_id];
    if (r && r.score < 55) issues.push('readiness');
    if (!issues.length) continue;
    const row = {
      id: rid('se'),
      link_id: link.id,
      extreme_user: link.extreme_user,
      athlete_id: link.athlete_id,
      issues,
      readiness: r?.score ?? null,
      at: new Date().toISOString(),
    };
    flags.push(row);
    prependItem('sport-eligibility', row, 200);
    let agent = 'SPORT-BRIDGE';
    if (issues.includes('waiver')) agent = 'DAZE-VISION';
    else if (
      issues.includes('readiness') ||
      issues.includes('clearance') ||
      issues.includes('injury') ||
      issues.includes('rtp')
    ) {
      agent = 'LIFE-COACH-AI';
    }
    const job = enqueueAgentJob(
      {
        agent,
        title: `eligibilite · ${link.athlete_name || link.athlete_id} · ${issues.join('+')}`,
        priority:
          issues.includes('readiness') ||
          issues.includes('waiver') ||
          issues.includes('clearance') ||
          issues.includes('injury')
            ? 'high'
            : 'normal',
        payload: { link_id: link.id, issues, athlete_id: link.athlete_id },
      },
      actor,
    );
    jobs.push(job.job?.id);
  }
  appendAudit({
    actor,
    action: 'sport.eligibility',
    detail: `${flags.length} bayrak · ${jobs.length} iş`,
    meta: { flags: flags.length },
  });
  return {
    ok: true,
    flags,
    jobs,
    summary: { scanned: (overview.links || []).length, flagged: flags.length },
    overview: sportBridgeOverview(),
  };
}
