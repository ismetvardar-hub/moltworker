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
