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
  const waitlist = ensureWaitlist().filter((w) => w.status === 'waiting');
  const reservations = readCollection('extreme-reservations', []) || [];
  const ledger = readCollection('extreme-gear-ledger', []) || [];
  const sweeps = readCollection('extreme-gear-sweeps', []) || [];
  const expires = readCollection('extreme-waitlist-expires', []) || [];
  const now = Date.now();
  const gear_overdue = gear.filter((g) => g.status === 'out' && g.due_at && new Date(g.due_at).getTime() < now).length;
  const resRows = Array.isArray(reservations) ? reservations : [];
  return {
    club_id: CLUB_ID,
    title: 'Antalya Extreme Spor · Yaşam & Deneyim Parkı',
    ethos: 'Centilmenlik önce, adrenalin sonra — ETHOS güler, NEXUS açar.',
    weather,
    branches: BRANCHES,
    slots,
    members,
    gear,
    gear_ledger: (Array.isArray(ledger) ? ledger : []).slice(0, 20),
    gear_sweeps: (Array.isArray(sweeps) ? sweeps : []).slice(0, 8),
    waitlist: waitlist.slice(0, 30),
    waitlist_expires: (Array.isArray(expires) ? expires : []).slice(0, 8),
    reservations: resRows.slice(0, 40),
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
      gear_ready: gear.filter((g) => g.status === 'ready').length,
      gear_overdue,
      waiver_pending: members.filter((m) => !m.user_profile?.waiver_signed).length,
      waitlist: waitlist.length,
      checked_in: resRows.filter((r) => r.status === 'checked_in').length,
      no_show: resRows.filter((r) => r.status === 'no_show').length,
      confirmed: resRows.filter((r) => r.status === 'confirmed').length,
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
  const credit = Number(member.wallet_credit_try) || 0;
  const fnbMin = seg.fnbMinTry;
  const wallet = {
    nfc_wallet_id: member.user_profile.nfc_wallet_id,
    balance_try: Math.max(0, 2500 + credit - spend),
    credit_try: credit,
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
  const bal = Math.max(
    0,
    2500 + (Number(members[idx].wallet_credit_try) || 0) - (Number(members[idx].fnb_spend_try) || 0),
  );
  if (amount > bal && !input.force) return { ok: false, error: 'Yetersiz bakiye', balance_try: bal };
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

function ensureWaitlist() {
  const list = readCollection('extreme-waitlist', null);
  return Array.isArray(list) ? list : [];
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
  // hava iptallerinden sonra demo için bir slotu reopen
  if (!slot) {
    const reopenIdx = slots.findIndex(
      (s) =>
        (s.status === 'cancelled_weather' || s.status === 'weather_hold') &&
        (s.booked || 0) < (s.capacity || 1),
    );
    if (reopenIdx >= 0) {
      slots[reopenIdx] = { ...slots[reopenIdx], status: 'open', cancel_reason: null, hold_until: null };
      writeCollection('extreme-slots', slots);
      slot = slots[reopenIdx];
    }
  }
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

/** Ekipman checkout — waiver + kota + ready gear */
export function issueExtremeGear(input = {}, actor = 'system') {
  const userId = input.user_id || 'guest_ela';
  const members = ensureMembers();
  const midx = members.findIndex((m) => m.user_profile?.user_id === userId || m.id === userId);
  if (midx < 0) return { ok: false, error: 'Üye yok' };
  const member = members[midx];
  if (!member.user_profile?.waiver_signed) {
    return { ok: false, error: 'Waiver gerekli' };
  }
  const holds = Number(member.quota_management?.gear_holds) || 0;
  const holdCap = Number(input.max_holds) || 2;
  if (holds >= holdCap) {
    return { ok: false, error: 'Ekipman kotası dolu' };
  }
  const gear = ensureGear();
  let idx = gear.findIndex(
    (g) =>
      (g.id === input.gear_id || g.serial === input.gear_id || g.id === input.id) &&
      (g.status === 'ready' || !g.status),
  );
  if (idx < 0) {
    idx = gear.findIndex((g) => g.status === 'ready' && !g.holder);
  }
  if (idx < 0) return { ok: false, error: 'Hazır ekipman yok' };
  const item = gear[idx];
  const branch =
    input.branch ||
    member.active_reservation?.branch ||
    (item.kind === 'MTB' ? 'mtb_trail' : item.kind === 'İp' ? 'paragliding' : 'skatepark');
  const dueHours = Number(input.due_hours) || 4;
  const dueAt = new Date(Date.now() + dueHours * 3600_000).toISOString();
  gear[idx] = {
    ...item,
    status: 'out',
    holder: member.user_profile.user_id,
    holder_name: member.user_profile.display_name,
    branch,
    issued_at: new Date().toISOString(),
    due_at: dueAt,
    reservation_id: input.reservation_id || member.active_reservation?.reservation_id || null,
    return_note: null,
    condition: item.condition || 'ok',
  };
  writeCollection('extreme-gear', gear);
  members[midx] = {
    ...member,
    quota_management: {
      ...member.quota_management,
      gear_holds: holds + 1,
    },
  };
  writeCollection('extreme-members', members);
  const ledger = {
    id: rid('xgl'),
    gear_id: item.id,
    serial: item.serial,
    kind: item.kind,
    user_id: member.user_profile.user_id,
    action: 'issue',
    branch,
    due_at: dueAt,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('extreme-gear-ledger', ledger, 400);
  enqueueAgentJob(
    {
      agent: 'HEPHAESTUS',
      title: `gear out · ${item.serial} · ${member.user_profile.display_name}`,
      priority: 'normal',
      payload: { gear_id: item.id, user_id: member.user_profile.user_id, due_at: dueAt },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'extreme.gear_issue',
    detail: `${item.serial} → ${member.user_profile.user_id}`,
    meta: { id: item.id, ledger_id: ledger.id },
  });
  return {
    ok: true,
    gear: gear[idx],
    ledger,
    user_spec: extremeUserSpec(userId),
    overview: extremeOverview(),
  };
}

/** Servis / gecikme taraması — HEPHAESTUS kuyruğu */
export function runExtremeGearServiceSweep(input = {}, actor = 'system') {
  const gear = ensureGear();
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  const flagged = [];
  const jobs = [];
  for (let i = 0; i < gear.length; i++) {
    const g = gear[i];
    const serviceDue = g.next_service && String(g.next_service) <= today;
    const overdue = g.status === 'out' && g.due_at && new Date(g.due_at).getTime() < now;
    const damaged = g.condition === 'damaged' || g.status === 'damaged';
    const inService = g.status === 'service';
    if (!serviceDue && !overdue && !damaged && !(inService && input.include_open)) continue;
    const reason = damaged
      ? 'damaged'
      : overdue
        ? 'overdue'
        : serviceDue
          ? 'service_due'
          : 'open_service';
    if (serviceDue && g.status === 'ready') {
      gear[i] = { ...g, status: 'service', service_flag: reason };
    } else if (overdue || damaged) {
      gear[i] = { ...g, service_flag: reason };
    }
    flagged.push({ ...gear[i], reason });
    const job = enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `gear sweep · ${g.serial} · ${reason}`,
        priority: damaged || overdue ? 'high' : 'normal',
        payload: { gear_id: g.id, reason },
      },
      actor,
    );
    jobs.push(job?.id || g.id);
  }
  if (flagged.some((f) => f.status === 'service' || f.service_flag)) {
    writeCollection('extreme-gear', gear);
  }
  const sweep = {
    id: rid('xgs'),
    flagged: flagged.length,
    reasons: flagged.reduce((acc, f) => {
      acc[f.reason] = (acc[f.reason] || 0) + 1;
      return acc;
    }, {}),
    gear_ids: flagged.map((f) => f.id),
    jobs: jobs.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('extreme-gear-sweeps', sweep, 120);
  appendAudit({
    actor,
    action: 'extreme.gear_service_sweep',
    detail: `${sweep.flagged} ekipman`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, flagged, overview: extremeOverview() };
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
  prependItem(
    'extreme-gear-ledger',
    {
      id: rid('xgl'),
      gear_id: item.id,
      serial: item.serial,
      kind: item.kind,
      user_id: holder,
      action: damaged ? 'damage_return' : 'return',
      at: new Date().toISOString(),
      actor,
    },
    400,
  );
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

/** Slot dolu / hold → bekleme listesi */
export function joinExtremeWaitlist(input = {}, actor = 'system') {
  const slots = ensureSlots();
  const slot =
    slots.find((s) => s.id === input.slot_id) ||
    slots.find((s) => s.status === 'full' || s.status === 'weather_hold') ||
    slots[0];
  if (!slot) return { ok: false, error: 'Slot yok' };
  const userId = input.user_id || 'guest_ela';
  const list = ensureWaitlist();
  if (list.some((w) => w.user_id === userId && w.slot_id === slot.id && w.status === 'waiting')) {
    return { ok: false, error: 'Zaten waitlistte' };
  }
  const row = {
    id: rid('xw'),
    slot_id: slot.id,
    branch: slot.branch,
    slot_start: slot.slot_start,
    user_id: userId,
    status: 'waiting',
    at: new Date().toISOString(),
    actor,
  };
  list.unshift(row);
  writeCollection('extreme-waitlist', list.slice(0, 300));
  enqueueAgentJob(
    {
      agent: 'REMINDER-AI',
      title: `waitlist · ${userId} · ${slot.branch} ${slot.slot_start}`,
      priority: 'normal',
      payload: { waitlist_id: row.id, slot_id: slot.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'extreme.waitlist_join',
    detail: `${userId} · ${slot.branch}`,
    meta: { id: row.id },
  });
  return { ok: true, entry: row, overview: extremeOverview() };
}

/** Waitlistten ilk kişiyi rezervasyona yükselt */
export function promoteExtremeWaitlist(input = {}, actor = 'system') {
  const list = ensureWaitlist();
  let idx = list.findIndex((w) => w.id === input.waitlist_id && w.status === 'waiting');
  if (idx < 0) idx = list.findIndex((w) => w.status === 'waiting');
  if (idx < 0) return { ok: false, error: 'Waitlist boş' };
  const entry = list[idx];
  list[idx] = { ...entry, status: 'promoted', promoted_at: new Date().toISOString() };
  writeCollection('extreme-waitlist', list);
  const reserved = reserveExtremeSlot(
    { user_id: entry.user_id, slot_id: input.slot_id || entry.slot_id },
    actor,
  );
  appendAudit({
    actor,
    action: 'extreme.waitlist_promote',
    detail: `${entry.user_id} · ${entry.slot_id}`,
    meta: { id: entry.id, reserved: !!reserved.ok },
  });
  return { ok: true, entry: list[idx], reservation: reserved, overview: extremeOverview() };
}

function freeExtremeSlotCapacity(slotId) {
  if (!slotId) return null;
  const slots = ensureSlots();
  const sidx = slots.findIndex((s) => s.id === slotId);
  if (sidx < 0) return null;
  const booked = Math.max(0, (Number(slots[sidx].booked) || 1) - 1);
  slots[sidx] = {
    ...slots[sidx],
    booked,
    status: slots[sidx].status === 'full' ? 'open' : slots[sidx].status,
  };
  writeCollection('extreme-slots', slots);
  return slots[sidx];
}

/** Gün-içi check-in — confirmed → checked_in (NEXUS gate) */
export function checkInExtremeReservation(input = {}, actor = 'system') {
  const userId = input.user_id || 'guest_can';
  const members = ensureMembers();
  const midx = members.findIndex((m) => m.user_profile?.user_id === userId || m.id === userId);
  if (midx < 0) return { ok: false, error: 'Üye yok' };
  const member = members[midx];
  const reservations = readCollection('extreme-reservations', []) || [];
  let ridx = reservations.findIndex(
    (r) =>
      r.id === input.reservation_id ||
      (r.user_id === userId &&
        (r.status === 'confirmed' || r.status === 'checked_in') &&
        (!input.slot_id || r.slot_id === input.slot_id)),
  );
  if (ridx < 0 && member.active_reservation?.reservation_id) {
    ridx = reservations.findIndex((r) => r.id === member.active_reservation.reservation_id);
  }
  if (ridx < 0) return { ok: false, error: 'Rezervasyon yok' };
  const row = reservations[ridx];
  if (row.status === 'checked_in') {
    return { ok: true, reservation: row, already: true, overview: extremeOverview() };
  }
  if (row.status !== 'confirmed') {
    return { ok: false, error: `Durum ${row.status}` };
  }
  const gate = input.gate || 'main';
  reservations[ridx] = {
    ...row,
    status: 'checked_in',
    checked_in_at: new Date().toISOString(),
    gate,
    checked_in_by: actor,
  };
  writeCollection('extreme-reservations', reservations);
  members[midx] = {
    ...member,
    active_reservation: {
      ...(member.active_reservation || {}),
      branch: row.branch,
      slot_start: row.slot_start,
      slot_id: row.slot_id,
      reservation_id: row.id,
      status: 'checked_in',
      gate,
    },
  };
  writeCollection('extreme-members', members);
  enqueueAgentJob(
    {
      agent: 'NEXUS',
      title: `check-in · ${member.user_profile.display_name} · ${row.branch} · ${gate}`,
      priority: 'high',
      payload: { reservation_id: row.id, gate },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'extreme.check_in',
    detail: `${userId} · ${row.branch} · ${gate}`,
    meta: { reservation_id: row.id, gate },
  });
  return { ok: true, reservation: reservations[ridx], overview: extremeOverview() };
}

/** No-show — kapasite serbest, isteğe bağlı waitlist promote */
export function markExtremeNoShow(input = {}, actor = 'system') {
  const userId = input.user_id || 'guest_can';
  const members = ensureMembers();
  const midx = members.findIndex((m) => m.user_profile?.user_id === userId || m.id === userId);
  if (midx < 0) return { ok: false, error: 'Üye yok' };
  const member = members[midx];
  const reservations = readCollection('extreme-reservations', []) || [];
  let ridx = reservations.findIndex(
    (r) =>
      r.id === input.reservation_id ||
      (r.user_id === userId && r.status === 'confirmed' && (!input.slot_id || r.slot_id === input.slot_id)),
  );
  if (ridx < 0 && member.active_reservation?.reservation_id) {
    ridx = reservations.findIndex(
      (r) => r.id === member.active_reservation.reservation_id && r.status === 'confirmed',
    );
  }
  if (ridx < 0) return { ok: false, error: 'Confirmed rezervasyon yok' };
  const row = reservations[ridx];
  reservations[ridx] = {
    ...row,
    status: 'no_show',
    no_show_at: new Date().toISOString(),
    no_show_by: actor,
    reason: input.reason || 'grace_expired',
  };
  writeCollection('extreme-reservations', reservations);
  freeExtremeSlotCapacity(row.slot_id);
  const used = Math.max(0, (Number(member.quota_management?.weekly_used) || 1) - 1);
  members[midx] = {
    ...member,
    quota_management: { ...member.quota_management, weekly_used: used },
    active_reservation: null,
  };
  writeCollection('extreme-members', members);
  let promoted = null;
  if (input.promote !== false) {
    const waiting = ensureWaitlist().find((w) => w.status === 'waiting' && w.slot_id === row.slot_id)
      || ensureWaitlist().find((w) => w.status === 'waiting');
    if (waiting) {
      promoted = promoteExtremeWaitlist({ waitlist_id: waiting.id, slot_id: row.slot_id }, actor);
    }
  }
  enqueueAgentJob(
    {
      agent: 'REMINDER-AI',
      title: `no-show · ${userId} · ${row.branch}`,
      priority: 'normal',
      payload: { reservation_id: row.id, slot_id: row.slot_id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'extreme.no_show',
    detail: `${userId} · ${row.slot_id}`,
    meta: { reservation_id: row.id, promoted: !!promoted?.ok },
  });
  return {
    ok: true,
    reservation: reservations[ridx],
    promoted,
    overview: extremeOverview(),
  };
}

/** Eski waitlist kayıtlarını expire et */
export function expireExtremeWaitlist(input = {}, actor = 'system') {
  const maxAgeMin = Number(input.max_age_min) || 90;
  const cutoff = Date.now() - maxAgeMin * 60_000;
  const list = ensureWaitlist();
  const expired = [];
  for (let i = 0; i < list.length; i++) {
    const w = list[i];
    if (w.status !== 'waiting') continue;
    const at = w.at ? new Date(w.at).getTime() : 0;
    const force = input.waitlist_id === w.id || input.force === true;
    if (!force && at && at > cutoff) continue;
    if (input.branch && w.branch !== input.branch) continue;
    list[i] = {
      ...w,
      status: 'expired',
      expired_at: new Date().toISOString(),
      expired_by: actor,
      expire_reason: input.reason || (force ? 'force' : 'stale'),
    };
    expired.push(list[i]);
  }
  writeCollection('extreme-waitlist', list);
  const sweep = {
    id: rid('xwe'),
    at: new Date().toISOString(),
    actor,
    max_age_min: maxAgeMin,
    expired: expired.length,
    ids: expired.map((e) => e.id),
  };
  prependItem('extreme-waitlist-expires', sweep, 80);
  if (expired.length) {
    enqueueAgentJob(
      {
        agent: 'REMINDER-AI',
        title: `waitlist expire · ${expired.length}`,
        priority: 'low',
        payload: { ids: sweep.ids, max_age_min: maxAgeMin },
      },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'extreme.waitlist_expire',
    detail: `${expired.length} kayıt · ${maxAgeMin}dk`,
    meta: { ids: sweep.ids },
  });
  return { ok: true, sweep, expired, overview: extremeOverview() };
}
/** MaaS QR yenile / süre uzat */
export function renewExtremeMaas(input = {}, actor = 'system') {
  const list = readCollection('extreme-maas', []) || [];
  const maasList = Array.isArray(list) ? list : [];
  let idx = maasList.findIndex((m) => m.id === input.id);
  if (idx < 0) {
    idx = maasList.findIndex(
      (m) =>
        (m.status === 'ready' || m.status === 'expired') &&
        (!input.user_id || m.user_id === input.user_id) &&
        (!input.kind || m.kind === input.kind),
    );
  }
  if (idx < 0) {
    const created = createExtremeMaas(input, actor);
    if (!created.ok) return created;
    return { ok: true, maas: created.maas, renewed: false, overview: extremeOverview() };
  }
  const hours = Number(input.hours) || 48;
  const token = randomBytes(6).toString('hex');
  maasList[idx] = {
    ...maasList[idx],
    status: 'ready',
    qr_url: `https://media.likya.local/maas/${token}`,
    qr_payload: `LYK-MAAS:${maasList[idx].kind}:${token}`,
    expires_at: new Date(Date.now() + hours * 3600_000).toISOString(),
    renewed_at: new Date().toISOString(),
    renewed_by: actor,
    renew_count: (Number(maasList[idx].renew_count) || 0) + 1,
  };
  writeCollection('extreme-maas', maasList);
  prependItem(
    'extreme-maas-renewals',
    {
      id: rid('xmr'),
      maas_id: maasList[idx].id,
      user_id: maasList[idx].user_id,
      hours,
      at: new Date().toISOString(),
      actor,
    },
    120,
  );
  appendAudit({
    actor,
    action: 'extreme.maas_renew',
    detail: `${maasList[idx].user_id} · ${maasList[idx].kind}`,
    meta: { id: maasList[idx].id },
  });
  return { ok: true, maas: maasList[idx], renewed: true, overview: extremeOverview() };
}

/** NFC cüzdan top-up */
export function topUpExtremeWallet(input = {}, actor = 'system') {
  const userId = input.user_id || 'guest_can';
  const amount = Number(input.amount) || 0;
  if (amount <= 0) return { ok: false, error: 'Geçersiz tutar' };
  const members = ensureMembers();
  const idx = members.findIndex((m) => m.user_profile?.user_id === userId || m.id === userId);
  if (idx < 0) return { ok: false, error: 'Üye bulunamadı' };
  const credit = (Number(members[idx].wallet_credit_try) || 0) + amount;
  members[idx] = {
    ...members[idx],
    wallet_credit_try: credit,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('extreme-members', members);
  const topup = {
    id: rid('xwt'),
    user_id: members[idx].user_profile.user_id,
    amount_try: amount,
    credit_try: credit,
    channel: input.channel || 'nfc_kiosk',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('extreme-wallet-topups', topup, 200);
  appendAudit({
    actor,
    action: 'extreme.wallet_topup',
    detail: `${userId} · +${amount} TRY`,
    meta: { id: topup.id },
  });
  return { ok: true, topup, user_spec: extremeUserSpec(userId) };
}

/** Hava hold sweep — süresi dolan hold temizle / yeni hold uygula */
export function runExtremeWeatherHoldSweep(input = {}, actor = 'system') {
  const slots = ensureSlots();
  const now = Date.now();
  const expiredHolds = [];
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot.status !== 'weather_hold') continue;
    const until = slot.hold_until ? new Date(slot.hold_until).getTime() : 0;
    if (!input.force && until && until > now) continue;
    expiredHolds.push(slot.id);
  }
  let cleared = { cleared: [] };
  if (expiredHolds.length || input.force_clear) {
    cleared = clearExtremeWeatherHold(
      { cancel: !!input.cancel_expired, force: true },
      actor,
    );
  }
  let held = { held: [] };
  const weather = buildWeatherBrief('venue_antalya_extreme');
  const condition = input.force_condition || weather.condition || 'clear';
  const sensitive = ['windy', 'storm', 'rain', 'lightning'];
  if (input.force_hold || sensitive.includes(condition)) {
    held = applyExtremeWeatherHold(
      {
        force_condition: condition,
        minutes: Number(input.minutes) || 45,
        force: !!input.force_hold || sensitive.includes(condition),
        slot_id: input.slot_id,
      },
      actor,
    );
  }
  const sweep = {
    id: rid('xwhs'),
    expired_holds: expiredHolds.length,
    cleared: (cleared.cleared || []).length,
    held: (held.held || []).length,
    condition,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('extreme-weather-hold-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'extreme.weather_hold_sweep',
    detail: `clear ${sweep.cleared} · hold ${sweep.held} · ${condition}`,
    meta: { id: sweep.id },
  });
  return {
    ok: true,
    sweep,
    cleared: cleared.cleared || [],
    held: held.held || [],
    overview: extremeOverview(),
  };
}
