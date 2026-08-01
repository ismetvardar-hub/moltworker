/**
 * Antalya Extreme Spor Kulübü / Yaşam & Deneyim Parkı
 * AŞAMA 321–325 vizyonu — bağımsız extremepark modülü (events/integrations dokunulmaz).
 *
 * JSON şema: club_id, user_profile, quota_management, active_reservation
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { buildWeatherBrief } from './weather.js';
import { enqueueAgentJob } from './agentqueue.js';

const CLUB_ID = 'likya_antalya_extreme';

const SEGMENTS = {
  daypass: {
    label: 'Günübirlik Pass',
    zones: ['skatepark', 'trampoline'],
    fnbMinTry: 350,
    maasIncluded: false,
    vipGate: false,
  },
  silver: {
    label: 'Silver',
    zones: ['skatepark', 'trampoline', 'mtb_trail'],
    fnbMinTry: 600,
    maasIncluded: true,
    vipGate: false,
  },
  platinum: {
    label: 'Platinum',
    zones: ['skatepark', 'trampoline', 'mtb_trail', 'rafting', 'paragliding'],
    fnbMinTry: 1200,
    maasIncluded: true,
    vipGate: true,
  },
  premium_extreme: {
    label: 'Premium Extreme VIP',
    zones: ['skatepark', 'trampoline', 'mtb_trail', 'rafting', 'paragliding', 'vip_lounge'],
    fnbMinTry: 0,
    maasIncluded: true,
    vipGate: true,
  },
};

const BRANCHES = [
  {
    id: 'paragliding',
    title: 'Paragliding',
    rhythm: '30 dk',
    slotMins: 30,
    weatherSensitive: true,
    cancelOn: ['windy', 'rain'],
  },
  {
    id: 'skatepark',
    title: 'Skatepark',
    rhythm: 'saatlik',
    slotMins: 60,
    weatherSensitive: false,
    cancelOn: ['rain'],
  },
  {
    id: 'rafting',
    title: 'Rafting',
    rhythm: 'grup çıkışı',
    slotMins: 120,
    weatherSensitive: true,
    cancelOn: ['rain'],
  },
  {
    id: 'mtb_trail',
    title: 'MTB Trail',
    rhythm: '90 dk',
    slotMins: 90,
    weatherSensitive: true,
    cancelOn: ['rain'],
  },
];

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensureMembers() {
  let list = readCollection('extreme-members', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'xm_1',
        club_id: CLUB_ID,
        user_profile: {
          user_id: 'guest_can',
          display_name: 'Can Yılmaz',
          segment: 'platinum',
          nfc_wallet_id: 'nfc_lyk_88',
          waiver_signed: false,
          phone: '+905551112233',
        },
        quota_management: {
          weekly_slots: 4,
          weekly_used: 1,
          maas_credits: 2,
          gear_holds: 1,
        },
        active_reservation: {
          reservation_id: 'xr_seed',
          branch: 'paragliding',
          slot_start: '10:00',
          status: 'confirmed',
        },
        fnb_spend_try: 420,
        at: new Date().toISOString(),
      },
      {
        id: 'xm_2',
        club_id: CLUB_ID,
        user_profile: {
          user_id: 'guest_ela',
          display_name: 'Ela Demir',
          segment: 'daypass',
          nfc_wallet_id: 'nfc_lyk_21',
          waiver_signed: true,
          phone: '+905559998877',
        },
        quota_management: {
          weekly_slots: 1,
          weekly_used: 0,
          maas_credits: 0,
          gear_holds: 0,
        },
        active_reservation: null,
        fnb_spend_try: 180,
        at: new Date().toISOString(),
      },
    ];
    writeCollection('extreme-members', list);
  }
  return list;
}

function ensureSlots() {
  let list = readCollection('extreme-slots', null);
  if (!Array.isArray(list) || list.length === 0) {
    const day = new Date().toISOString().slice(0, 10);
    list = [
      {
        id: 'xs_1',
        club_id: CLUB_ID,
        branch: 'paragliding',
        day,
        slot_start: '10:00',
        capacity: 6,
        booked: 4,
        status: 'open',
        weather_gate: true,
      },
      {
        id: 'xs_2',
        club_id: CLUB_ID,
        branch: 'paragliding',
        day,
        slot_start: '10:30',
        capacity: 6,
        booked: 6,
        status: 'full',
        weather_gate: true,
      },
      {
        id: 'xs_3',
        club_id: CLUB_ID,
        branch: 'skatepark',
        day,
        slot_start: '11:00',
        capacity: 20,
        booked: 9,
        status: 'open',
        weather_gate: false,
      },
      {
        id: 'xs_4',
        club_id: CLUB_ID,
        branch: 'rafting',
        day,
        slot_start: '09:00',
        capacity: 12,
        booked: 12,
        status: 'full',
        weather_gate: true,
      },
      {
        id: 'xs_5',
        club_id: CLUB_ID,
        branch: 'mtb_trail',
        day,
        slot_start: '14:00',
        capacity: 8,
        booked: 3,
        status: 'open',
        weather_gate: true,
      },
    ];
    writeCollection('extreme-slots', list);
  }
  return list;
}

function ensureGear() {
  let list = readCollection('extreme-gear', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'xg_1',
        serial: 'HK-MTB-014',
        kind: 'MTB',
        status: 'out',
        holder: 'guest_can',
        next_service: '2026-08-15',
      },
      {
        id: 'xg_2',
        serial: 'HK-HELM-77',
        kind: 'Kask',
        status: 'ready',
        holder: null,
        next_service: '2026-09-01',
      },
      {
        id: 'xg_3',
        serial: 'HK-ROPE-09',
        kind: 'İp',
        status: 'service',
        holder: null,
        next_service: '2026-08-02',
      },
    ];
    writeCollection('extreme-gear', list);
  }
  return list;
}

function ensureWaivers() {
  const list = readCollection('extreme-waivers', null);
  return Array.isArray(list) ? list : [];
}

function ensureMaas() {
  let list = readCollection('extreme-maas', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [];
    writeCollection('extreme-maas', list);
  }
  return list;
}

function ensureNotices() {
  const list = readCollection('extreme-notices', null);
  return Array.isArray(list) ? list : [];
}

function segmentOf(member) {
  const key = member?.user_profile?.segment || 'daypass';
  return SEGMENTS[key] || SEGMENTS.daypass;
}

/** GET /api/extreme — Hub özeti */
export function extremeOverview() {
  const members = ensureMembers();
  const slots = ensureSlots();
  const gear = ensureGear();
  const waivers = ensureWaivers();
  const weather = buildWeatherBrief('venue_antalya_extreme');
  const notices = ensureNotices();
  return {
    club_id: CLUB_ID,
    title: 'Antalya Extreme Spor · Yaşam & Deneyim Parkı',
    ethos: 'Centilmenlik önce, adrenalin sonra — ETHOS güler, NEXUS açar.',
    weather,
    branches: BRANCHES,
    slots,
    members,
    gear,
    waivers_total: waivers.length,
    notices: notices.slice(0, 20),
    agents: {
      NEXUS: 'NFC · turnike · VIP kapı · ışık',
      HEPHAESTUS: 'Seri no ekipman · bakım',
      'REMINDER-AI': 'WhatsApp oto-iptal / slot değişimi',
      MINT: 'Doluluk & sezon dinamik fiyat',
      'DAZE-VISION': 'Waiver · MaaS QR · NFC cüzdan',
    },
    summary: {
      open_slots: slots.filter((s) => s.status === 'open').length,
      cancelled_slots: slots.filter((s) => s.status === 'cancelled_weather').length,
      gear_out: gear.filter((g) => g.status === 'out').length,
      gear_service: gear.filter((g) => g.status === 'service').length,
      waiver_pending: members.filter((m) => !m.user_profile?.waiver_signed).length,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * GET /api/extreme/user-spec?user_id=
 * Verilen JSON şemasına uygun üye yetki / harcama / slot hakları.
 */
export function extremeUserSpec(userId = 'guest_can') {
  const members = ensureMembers();
  let member = members.find((m) => m.user_profile?.user_id === userId || m.id === userId);
  if (!member) member = members[0];
  const seg = segmentOf(member);
  const spend = Number(member.fnb_spend_try) || 0;
  const fnbMin = seg.fnbMinTry;
  const wallet = {
    nfc_wallet_id: member.user_profile.nfc_wallet_id,
    balance_try: Math.max(0, 2500 - spend),
    fnb_spend_try: spend,
    fnb_min_try: fnbMin,
    fnb_gap_try: Math.max(0, fnbMin - spend),
    fnb_met: spend >= fnbMin,
  };
  return {
    club_id: member.club_id || CLUB_ID,
    user_profile: member.user_profile,
    quota_management: member.quota_management,
    active_reservation: member.active_reservation,
    segment: {
      id: member.user_profile.segment,
      ...seg,
    },
    wallet,
    rights: {
      zones: seg.zones,
      vip_gate: seg.vipGate,
      maas: seg.maasIncluded,
      can_book: (member.quota_management?.weekly_used || 0) < (member.quota_management?.weekly_slots || 0),
      waiver_ok: !!member.user_profile.waiver_signed,
    },
    generatedAt: new Date().toISOString(),
  };
}

/** POST /api/extreme/waiver */
export function signExtremeWaiver(input = {}, actor = 'system') {
  const userId = input.user_id || input.userId || 'guest_can';
  const members = ensureMembers();
  const idx = members.findIndex((m) => m.user_profile?.user_id === userId || m.id === userId);
  if (idx < 0) return { ok: false, error: 'Üye bulunamadı' };

  const waiver = {
    id: rid('xw'),
    club_id: CLUB_ID,
    user_id: members[idx].user_profile.user_id,
    display_name: members[idx].user_profile.display_name,
    version: input.version || '2026.1',
    signed_at: new Date().toISOString(),
    channel: input.channel || 'daze_vision',
    ip_stub: 'park-kiosk',
    actor,
  };
  prependItem('extreme-waivers', waiver, 500);
  members[idx] = {
    ...members[idx],
    user_profile: { ...members[idx].user_profile, waiver_signed: true },
    updatedAt: new Date().toISOString(),
  };
  writeCollection('extreme-members', members);
  appendAudit({
    actor,
    action: 'extreme.waiver',
    detail: `${waiver.display_name} feragatname v${waiver.version}`,
    meta: { user_id: waiver.user_id, waiver_id: waiver.id },
  });
  return { ok: true, waiver, user_spec: extremeUserSpec(userId) };
}

/**
 * POST /api/extreme/slot-weather-check
 * Hava durumuna göre slot iptal + REMINDER-AI WhatsApp simülasyonu (audit üzerinden).
 */
export function extremeSlotWeatherCheck(input = {}, actor = 'system') {
  const weather = buildWeatherBrief('venue_antalya_extreme');
  const condition = input.force_condition || weather.condition;
  const slots = ensureSlots();
  const members = ensureMembers();
  const cancelled = [];
  const notices = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const branch = BRANCHES.find((b) => b.id === slot.branch);
    if (!branch?.weatherSensitive) continue;
    if (!branch.cancelOn.includes(condition)) continue;
    if (slot.status === 'cancelled_weather') continue;

    slots[i] = {
      ...slot,
      status: 'cancelled_weather',
      cancel_reason: `Hava: ${condition}`,
      cancelled_at: new Date().toISOString(),
    };
    cancelled.push(slots[i]);

    // Etkilenen üyeler — aktif rezervasyonu bu branşta olanlar
    for (const m of members) {
      const ar = m.active_reservation;
      if (!ar || ar.branch !== slot.branch) continue;
      if (ar.slot_start && ar.slot_start !== slot.slot_start) continue;
      const msg = {
        id: rid('xn'),
        channel: 'whatsapp',
        agent: 'REMINDER-AI',
        to: m.user_profile.phone,
        user_id: m.user_profile.user_id,
        body:
          `Merhaba ${m.user_profile.display_name}! ${branch.title} ${slot.slot_start} ` +
          `slotu hava (${condition}) nedeniyle iptal. Yeni slot için Daze Hub'a bak — ETHOS yanındayız 🌤️`,
        slot_id: slot.id,
        at: new Date().toISOString(),
        status: 'queued',
      };
      notices.push(msg);
      prependItem('extreme-notices', msg, 200);
      appendAudit({
        actor: 'REMINDER-AI',
        action: 'extreme.whatsapp.cancel',
        detail: msg.body.slice(0, 120),
        meta: { user_id: msg.user_id, slot_id: slot.id, channel: 'whatsapp' },
      });
    }
  }

  writeCollection('extreme-slots', slots);

  if (cancelled.length) {
    enqueueAgentJob(
      {
        agent: 'REMINDER-AI',
        title: `hava iptal: ${cancelled.length} slot — WA takip`,
        priority: 'high',
        payload: { condition, cancelled: cancelled.map((c) => c.id), notices: notices.length },
      },
      actor,
    );
  }

  appendAudit({
    actor,
    action: 'extreme.weather_check',
    detail: `${condition} → ${cancelled.length} slot iptal · ${notices.length} WA`,
    meta: { condition, cancelled: cancelled.length, notices: notices.length },
  });

  return {
    ok: true,
    weather: { ...weather, condition, label: condition },
    cancelled_slots: cancelled,
    whatsapp_notices: notices,
    slots: ensureSlots(),
  };
}

/** POST /api/extreme/maas — Drone/GoPro MaaS QR */
export function createExtremeMaas(input = {}, actor = 'system') {
  const userId = input.user_id || 'guest_can';
  const spec = extremeUserSpec(userId);
  if (!spec.rights.maas && spec.segment.id === 'daypass') {
    return { ok: false, error: 'Günübirlik Pass MaaS içermez — Silver+ veya tek seferlik satın al.' };
  }
  const kind = input.kind || 'gopro';
  const token = randomBytes(6).toString('hex');
  const item = {
    id: rid('maas'),
    club_id: CLUB_ID,
    user_id: spec.user_profile.user_id,
    kind,
    branch: input.branch || spec.active_reservation?.branch || 'paragliding',
    qr_url: `https://media.likya.local/maas/${token}`,
    qr_payload: `LYK-MAAS:${kind}:${token}`,
    expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    status: 'ready',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('extreme-maas', item, 200);
  appendAudit({
    actor,
    action: 'extreme.maas',
    detail: `${item.user_id} · ${kind} QR`,
    meta: { id: item.id, kind },
  });
  return { ok: true, maas: item };
}

/** POST /api/extreme/wallet/spend — NFC cüzdan F&B harcama */
export function extremeWalletSpend(input = {}, actor = 'system') {
  const userId = input.user_id || 'guest_can';
  const amount = Number(input.amount) || 0;
  if (amount <= 0) return { ok: false, error: 'Geçersiz tutar' };
  const members = ensureMembers();
  const idx = members.findIndex((m) => m.user_profile?.user_id === userId);
  if (idx < 0) return { ok: false, error: 'Üye bulunamadı' };
  members[idx] = {
    ...members[idx],
    fnb_spend_try: (Number(members[idx].fnb_spend_try) || 0) + amount,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('extreme-members', members);
  appendAudit({
    actor,
    action: 'extreme.nfc_spend',
    detail: `${userId} · ${amount} TRY`,
    meta: { user_id: userId, amount },
  });
  return { ok: true, user_spec: extremeUserSpec(userId) };
}

/** PATCH gear status — HEPHAESTUS */
export function updateExtremeGear(id, patch = {}, actor = 'system') {
  const list = ensureGear();
  const idx = list.findIndex((g) => g.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('extreme-gear', list);
  appendAudit({
    actor,
    action: 'extreme.gear',
    detail: `${list[idx].serial} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function extremeparkSummary() {
  const o = extremeOverview();
  return {
    total: o.slots.length,
    open: o.summary.open_slots,
    cancelled_weather: o.summary.cancelled_slots,
    waiver_pending: o.summary.waiver_pending,
    extremepark: o.slots,
    overview: o,
  };
}

/** Hava hold — iptal değil; yeniden değerlendirme penceresi */
export function applyExtremeWeatherHold(input = {}, actor = 'system') {
  const weather = buildWeatherBrief('venue_antalya_extreme');
  const condition = input.force_condition || weather.condition || 'windy';
  const minutes = Number(input.minutes) || 60;
  const slots = ensureSlots();
  const held = [];
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const branch = BRANCHES.find((b) => b.id === slot.branch);
    if (!branch?.weatherSensitive) continue;
    if (input.slot_id && slot.id !== input.slot_id) continue;
    if (slot.status === 'cancelled_weather' || slot.status === 'full') continue;
    if (branch.cancelOn && !branch.cancelOn.includes(condition) && !input.force) continue;
    const until = new Date(Date.now() + minutes * 60_000).toISOString();
    slots[i] = {
      ...slot,
      status: 'weather_hold',
      hold_until: until,
      hold_condition: condition,
      prev_status: slot.status === 'weather_hold' ? slot.prev_status || 'open' : slot.status,
    };
    held.push(slots[i]);
  }
  writeCollection('extreme-slots', slots);
  if (held.length) {
    enqueueAgentJob(
      {
        agent: 'REMINDER-AI',
        title: `hava hold ${minutes}dk · ${held.length} slot (${condition})`,
        priority: 'high',
        payload: { condition, minutes, slots: held.map((h) => h.id) },
      },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'extreme.weather_hold',
    detail: `${condition} · ${held.length} slot · ${minutes}dk`,
    meta: { n: held.length, condition },
  });
  return { ok: true, held, minutes, condition, overview: extremeOverview() };
}

/** Hold temizle → open veya iptal */
export function clearExtremeWeatherHold(input = {}, actor = 'system') {
  const slots = ensureSlots();
  const cleared = [];
  const cancel = !!input.cancel;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot.status !== 'weather_hold') continue;
    if (input.slot_id && slot.id !== input.slot_id) continue;
    if (cancel) {
      slots[i] = {
        ...slot,
        status: 'cancelled_weather',
        cancel_reason: `Hold sonrası iptal: ${slot.hold_condition || 'hava'}`,
        cancelled_at: new Date().toISOString(),
        hold_until: null,
      };
    } else {
      slots[i] = {
        ...slot,
        status: slot.prev_status || 'open',
        hold_until: null,
        hold_condition: null,
        prev_status: undefined,
      };
    }
    cleared.push(slots[i]);
  }
  writeCollection('extreme-slots', slots);
  appendAudit({
    actor,
    action: cancel ? 'extreme.weather_hold_cancel' : 'extreme.weather_hold_clear',
    detail: `${cleared.length} slot`,
    meta: { n: cleared.length, cancel },
  });
  return { ok: true, cleared, cancel, overview: extremeOverview() };
}

/** Slot rezervasyonu — kota + waiver */
export function reserveExtremeSlot(input = {}, actor = 'system') {
  const userId = input.user_id || 'guest_can';
  const members = ensureMembers();
  const midx = members.findIndex((m) => m.user_profile?.user_id === userId || m.id === userId);
  if (midx < 0) return { ok: false, error: 'Üye yok' };
  const member = members[midx];
  if (!member.user_profile?.waiver_signed) {
    return { ok: false, error: 'Waiver gerekli' };
  }
  const used = Number(member.quota_management?.weekly_used) || 0;
  const limit = Number(member.quota_management?.weekly_slots) || 0;
  if (limit && used >= limit) {
    return { ok: false, error: 'Haftalık kota dolu' };
  }
  const slots = ensureSlots();
  let slot =
    slots.find((s) => s.id === input.slot_id) ||
    slots.find((s) => (s.status === 'open' || s.status === 'available') && (s.booked || 0) < (s.capacity || 1));
  if (!slot) return { ok: false, error: 'Müsait slot yok' };
  if (slot.status === 'weather_hold' || slot.status === 'cancelled_weather') {
    return { ok: false, error: `Slot ${slot.status}` };
  }
  const booked = (Number(slot.booked) || 0) + 1;
  const full = booked >= (Number(slot.capacity) || 1);
  const sidx = slots.findIndex((s) => s.id === slot.id);
  slots[sidx] = {
    ...slots[sidx],
    booked,
    status: full ? 'full' : slots[sidx].status === 'open' || !slots[sidx].status ? 'open' : slots[sidx].status,
  };
  writeCollection('extreme-slots', slots);
  const reservation = {
    id: rid('xr'),
    slot_id: slot.id,
    branch: slot.branch,
    slot_start: slot.slot_start,
    user_id: member.user_profile.user_id,
    status: 'confirmed',
    at: new Date().toISOString(),
  };
  members[midx] = {
    ...member,
    quota_management: {
      ...member.quota_management,
      weekly_used: used + 1,
    },
    active_reservation: {
      branch: slot.branch,
      slot_start: slot.slot_start,
      slot_id: slot.id,
      reservation_id: reservation.id,
    },
  };
  writeCollection('extreme-members', members);
  prependItem('extreme-reservations', reservation, 400);
  enqueueAgentJob(
    {
      agent: 'NEXUS',
      title: `slot reserve · ${member.user_profile.display_name} · ${slot.branch}`,
      priority: 'normal',
      payload: { reservation_id: reservation.id, slot_id: slot.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'extreme.reserve',
    detail: `${userId} · ${slot.branch} ${slot.slot_start}`,
    meta: { id: reservation.id },
  });
  return {
    ok: true,
    reservation,
    slot: slots[sidx],
    user_spec: extremeUserSpec(userId),
    overview: extremeOverview(),
  };
}

export function cancelExtremeReservation(input = {}, actor = 'system') {
  const userId = input.user_id || 'guest_can';
  const members = ensureMembers();
  const midx = members.findIndex((m) => m.user_profile?.user_id === userId || m.id === userId);
  if (midx < 0) return { ok: false, error: 'Üye yok' };
  const member = members[midx];
  const slotId = input.slot_id || member.active_reservation?.slot_id;
  const slots = ensureSlots();
  const sidx = slots.findIndex((s) => s.id === slotId);
  if (sidx >= 0) {
    const booked = Math.max(0, (Number(slots[sidx].booked) || 1) - 1);
    slots[sidx] = {
      ...slots[sidx],
      booked,
      status: slots[sidx].status === 'full' ? 'open' : slots[sidx].status,
    };
    writeCollection('extreme-slots', slots);
  }
  const used = Math.max(0, (Number(member.quota_management?.weekly_used) || 1) - 1);
  members[midx] = {
    ...member,
    quota_management: { ...member.quota_management, weekly_used: used },
    active_reservation: null,
  };
  writeCollection('extreme-members', members);
  const reservations = readCollection('extreme-reservations', []) || [];
  if (Array.isArray(reservations)) {
    const ridx = reservations.findIndex(
      (r) => r.id === input.reservation_id || (r.user_id === userId && r.slot_id === slotId && r.status === 'confirmed'),
    );
    if (ridx >= 0) {
      reservations[ridx] = { ...reservations[ridx], status: 'cancelled', cancelled_at: new Date().toISOString() };
      writeCollection('extreme-reservations', reservations);
    }
  }
  appendAudit({ actor, action: 'extreme.reserve_cancel', detail: `${userId} · ${slotId}`, meta: { slot_id: slotId } });
  return { ok: true, user_spec: extremeUserSpec(userId), overview: extremeOverview() };
}

/** Ekipman iade / hasar — holder temizle + HEPHAESTUS */
export function returnExtremeGear(input = {}, actor = 'system') {
  const gear = ensureGear();
  const idx = gear.findIndex((g) => g.id === input.gear_id || g.serial === input.gear_id || g.id === input.id);
  if (idx < 0) return { ok: false, error: 'Ekipman yok' };
  const item = gear[idx];
  const damaged = !!input.damaged || input.status === 'damaged';
  const service = !!input.service || input.status === 'service' || damaged;
  const holder = item.holder;
  gear[idx] = {
    ...item,
    status: service ? 'service' : 'ready',
    holder: null,
    returned_at: new Date().toISOString(),
    return_note: input.note || (damaged ? 'hasar bildirimi' : 'iade'),
    condition: damaged ? 'damaged' : input.condition || 'ok',
  };
  writeCollection('extreme-gear', gear);
  if (holder) {
    const members = ensureMembers();
    const midx = members.findIndex(
      (m) => m.user_profile?.user_id === holder || m.user_profile?.display_name === holder || m.id === holder,
    );
    if (midx >= 0) {
      const qm = members[midx].quota_management || {};
      const holds = Math.max(0, (Number(qm.gear_holds) || 1) - 1);
      members[midx] = {
        ...members[midx],
        quota_management: { ...qm, gear_holds: holds },
      };
      writeCollection('extreme-members', members);
    }
  }
  if (service) {
    enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `gear ${damaged ? 'hasar' : 'servis'} · ${item.serial}`,
        priority: damaged ? 'high' : 'normal',
        payload: { gear_id: item.id, damaged },
      },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'extreme.gear_return',
    detail: `${item.serial} → ${gear[idx].status}`,
    meta: { id: item.id },
  });
  return { ok: true, gear: gear[idx], overview: extremeOverview() };
}
