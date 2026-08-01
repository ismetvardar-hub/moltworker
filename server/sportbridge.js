/**
 * Spor köprüsü — Extreme Park ↔ Athlete OS tek nabız.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { extremeOverview } from './extremepark.js';
import { athleteOsOverview, logAthleteSession, upsertAthletePlan } from './athleteos.js';

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
    return {
      ...l,
      member_name: member?.user_profile?.display_name || l.extreme_user,
      athlete_name: athlete?.name || l.athlete_id,
      waiver_ok: !!member?.user_profile?.waiver_signed,
      segment: member?.user_profile?.segment || null,
      license: athlete?.license || null,
      weekly_used: member?.quota_management?.weekly_used ?? null,
    };
  });
  return enriched;
}

export function sportBridgeOverview() {
  const extreme = extremeOverview();
  const athletes = athleteOsOverview();
  const links = matchLinks(extreme, athletes);
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
    summary: {
      linked: links.length,
      waiver_gaps: links.filter((l) => !l.waiver_ok).length,
      licensed_links: links.filter((l) => l.license).length,
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

/** Extreme slot tamamlanınca athlete session yaz */
export function syncSlotToSession(input = {}, actor = 'system') {
  const extreme = extremeOverview();
  const slot = (extreme.slots || []).find((s) => s.id === input.slot_id) || (extreme.slots || [])[0];
  if (!slot) return { ok: false, error: 'Slot yok' };
  const links = ensureLinks();
  const userId = input.extreme_user || slot.user_id || links[0]?.extreme_user;
  const link = links.find((l) => l.extreme_user === userId) || links[0];
  if (!link) return { ok: false, error: 'Köprü yok — önce link' };
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
