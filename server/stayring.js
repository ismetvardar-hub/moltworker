/**
 * Adım 3+ — Konaklama halkası: glamping / karavan / bungalow + keyless / kışlama / HK.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensureUnits() {
  let list = readCollection('stay-units', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'su_1', type: 'glamping', code: 'GL-01', capacity: 2, status: 'free', rate_try: 4500, hk: 'clean', keyless: null },
      { id: 'su_2', type: 'glamping', code: 'GL-02', capacity: 4, status: 'occupied', rate_try: 6200, hk: 'dirty', keyless: 'KL-SEED' },
      { id: 'su_3', type: 'caravan', code: 'KV-07', capacity: 3, status: 'wintering', rate_try: 2800, hk: 'clean', keyless: null, hookup: true },
      { id: 'su_4', type: 'caravan', code: 'KV-12', capacity: 3, status: 'free', rate_try: 2800, hk: 'clean', keyless: null, hookup: true },
      { id: 'su_5', type: 'bungalow', code: 'BG-A1', capacity: 5, status: 'free', rate_try: 8900, hk: 'clean', keyless: null },
      { id: 'su_6', type: 'bungalow', code: 'BG-A2', capacity: 5, status: 'hold', rate_try: 8900, hk: 'inspect', keyless: null },
    ];
    writeCollection('stay-units', list);
  }
  return list;
}

function ensureBookings() {
  const list = readCollection('stay-bookings', null);
  return Array.isArray(list) ? list : [];
}

function ensureKeys() {
  const list = readCollection('stay-keys', null);
  return Array.isArray(list) ? list : [];
}

function ensureHk() {
  const list = readCollection('stay-hk', null);
  return Array.isArray(list) ? list : [];
}

function openStayringFlags() {
  const flags = readCollection('stayring-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

export function stayRingOverview() {
  const units = ensureUnits();
  const bookings = ensureBookings();
  const keys = ensureKeys();
  const hk = ensureHk();
  const rollups = readCollection('stay-night-rollups', []) || [];
  const lastRollup = Array.isArray(rollups) && rollups[0] ? rollups[0] : null;
  const guestReqs = readCollection('stay-guest-requests', []) || [];
  const openReqs = (Array.isArray(guestReqs) ? guestReqs : []).filter((r) => r.status === 'open');
  const folioCharges = readCollection('stay-folio-charges', []) || [];
  const folioList = Array.isArray(folioCharges) ? folioCharges : [];
  const folio = folioBalance(folioList);
  const settlements = readCollection('stay-folio-settlements', []) || [];
  const audits = readCollection('stay-night-audits', []) || [];
  const overstays = readCollection('stay-overstays', []) || [];
  const openOverstays = (Array.isArray(overstays) ? overstays : []).filter((o) => o.status === 'open');
  const today = new Date().toISOString().slice(0, 10);
  const agingStays = bookings.filter(
    (b) =>
      (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'overstay') &&
      bookingCheckoutDate(b) &&
      bookingCheckoutDate(b) < today,
  );
  const hkBacklog = hk.filter((t) => t.status === 'open').length + units.filter((u) => u.hk === 'dirty' || u.hk === 'inspect').length;
  const flags = openStayringFlags();
  return {
    title: 'Konaklama Halkası',
    units,
    bookings: bookings.slice(0, 30),
    keys: keys.slice(0, 20),
    hk: hk.slice(0, 20),
    guest_requests: (Array.isArray(guestReqs) ? guestReqs : []).slice(0, 20),
    night_rollups: (Array.isArray(rollups) ? rollups : []).slice(0, 10),
    night_audits: (Array.isArray(audits) ? audits : []).slice(0, 10),
    overstays: (Array.isArray(overstays) ? overstays : []).slice(0, 20),
    folio_charges: folioList.slice(0, 30),
    folio_settlements: (Array.isArray(settlements) ? settlements : []).slice(0, 15),
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      free: units.filter((u) => u.status === 'free').length,
      occupied: units.filter((u) => u.status === 'occupied').length,
      wintering: units.filter((u) => u.status === 'wintering').length,
      hold: units.filter((u) => u.status === 'hold').length,
      hk_dirty: units.filter((u) => u.hk === 'dirty' || u.hk === 'inspect').length,
      hk_open: hk.filter((t) => t.status === 'open').length,
      hk_backlog: hkBacklog,
      aging_stays: agingStays.length + openOverstays.length,
      keys_active: keys.filter((k) => k.status === 'active').length,
      guest_requests_open: openReqs.length,
      folio_open: folio.open_count,
      folio_balance_try: folio.balance_try,
      occupancy_pct: lastRollup?.occupancy_pct ?? null,
      revpar_try: lastRollup?.revpar_try ?? null,
      overstays_open: openOverstays.length,
      night_audits: (Array.isArray(audits) ? audits : []).length,
      late_checkouts: (readCollection('stay-late-checkouts', []) || []).filter((x) => x.status === 'scheduled').length,
      folio_disputes_open: folioList.filter((c) => c.status === 'disputed').length,
      keys_revoked: keys.filter((k) => k.status === 'revoked').length,
      byType: {
        glamping: units.filter((u) => u.type === 'glamping').length,
        caravan: units.filter((u) => u.type === 'caravan').length,
        bungalow: units.filter((u) => u.type === 'bungalow').length,
      },
    },
    summaryLines: [
      `Konaklama ${units.length} ünite · dolu ${units.filter((u) => u.status === 'occupied').length} · HK backlog ${hkBacklog}`,
      `Aging stay ${agingStays.length + openOverstays.length} · folio açık ${folio.open_count} · flag ${flags.length}`,
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function createStayBooking(input = {}, actor = 'system') {
  const units = ensureUnits();
  const unit =
    units.find((u) => u.id === input.unit_id || u.code === input.unit_id) ||
    units.find((u) => u.status === 'free');
  if (!unit) return { ok: false, error: 'Müsait ünite yok' };
  if (unit.status !== 'free' && unit.status !== 'hold') {
    return { ok: false, error: `Ünite müsait değil: ${unit.status}` };
  }
  const nights = Number(input.nights) || 2;
  const checkInAt = input.check_in || new Date().toISOString();
  const checkoutDate = new Date(new Date(checkInAt).getTime() + nights * 86400_000)
    .toISOString()
    .slice(0, 10);
  const booking = {
    id: rid('sb'),
    unit_id: unit.id,
    unit_code: unit.code,
    type: unit.type,
    guestName: input.guestName || 'Misafir',
    nights,
    check_in: checkInAt.slice(0, 10),
    checkout_date: input.checkout_date || checkoutDate,
    status: 'confirmed',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('stay-bookings', booking, 300);
  const idx = units.findIndex((u) => u.id === unit.id);
  units[idx] = { ...units[idx], status: 'occupied', hk: 'occupied' };
  writeCollection('stay-units', units);
  appendAudit({
    actor,
    action: 'stay.book',
    detail: `${booking.unit_code} · ${booking.guestName}`,
    meta: { id: booking.id },
  });
  return { ok: true, booking, overview: stayRingOverview() };
}

export function updateStayUnit(id, patch = {}, actor = 'system') {
  const list = ensureUnits();
  const idx = list.findIndex((u) => u.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('stay-units', list);
  appendAudit({ actor, action: 'stay.unit', detail: `${id} → ${list[idx].status}`, meta: { id } });
  return list[idx];
}

/** NFC / keyless kapı kodu */
export function issueStayKeyless(input = {}, actor = 'system') {
  const units = ensureUnits();
  const unit =
    units.find((u) => u.id === input.unit_id || u.code === input.unit_id) ||
    units.find((u) => u.status === 'occupied');
  if (!unit) return { ok: false, error: 'Ünite yok' };
  const code = `KL-${unit.code}-${randomBytes(2).toString('hex').toUpperCase()}`;
  const key = {
    id: rid('sk'),
    unit_id: unit.id,
    unit_code: unit.code,
    code,
    guest: input.guest || 'Misafir',
    status: 'active',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('stay-keys', key, 200);
  const idx = units.findIndex((u) => u.id === unit.id);
  units[idx] = { ...units[idx], keyless: code };
  writeCollection('stay-units', units);
  appendAudit({ actor, action: 'stay.keyless', detail: `${unit.code} · ${code}`, meta: { id: key.id } });
  return { ok: true, key, overview: stayRingOverview() };
}

/** Karavan kışlama */
export function setStayWintering(input = {}, actor = 'system') {
  const units = ensureUnits();
  const unit = units.find((u) => u.id === input.unit_id || u.code === input.unit_id);
  if (!unit) return { ok: false, error: 'Ünite yok' };
  if (unit.type !== 'caravan' && !input.force) {
    return { ok: false, error: 'Kışlama sadece karavan (force ile geç)' };
  }
  const idx = units.findIndex((u) => u.id === unit.id);
  units[idx] = {
    ...units[idx],
    status: 'wintering',
    hookup: true,
    winter_until: input.until || '2027-03-31',
  };
  writeCollection('stay-units', units);
  appendAudit({ actor, action: 'stay.winter', detail: unit.code, meta: { id: unit.id } });
  return { ok: true, unit: units[idx], overview: stayRingOverview() };
}

/** Housekeeping / linen görevi */
export function createStayHkTask(input = {}, actor = 'system') {
  const units = ensureUnits();
  const unit =
    units.find((u) => u.id === input.unit_id || u.code === input.unit_id) || units[0];
  if (!unit) return { ok: false, error: 'Ünite yok' };
  const task = {
    id: rid('hk'),
    unit_id: unit.id,
    unit_code: unit.code,
    kind: input.kind || 'linen',
    status: 'open',
    note: input.note || 'Çarşaf + temizlik',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('stay-hk', task, 300);
  const idx = units.findIndex((u) => u.id === unit.id);
  units[idx] = { ...units[idx], hk: input.hk_status || 'dirty' };
  writeCollection('stay-units', units);
  enqueueAgentJob(
    {
      agent: 'HEPHAESTUS',
      title: `HK dirty · ${unit.code} · ${task.kind}`,
      priority: 'normal',
      payload: { unit_id: unit.id, task_id: task.id },
    },
    actor,
  );
  appendAudit({ actor, action: 'stay.hk', detail: `${unit.code} · ${task.kind}`, meta: { id: task.id } });
  return { ok: true, task, overview: stayRingOverview() };
}

/** Checkout → ünite free + HK dirty */
export function checkoutStay(input = {}, actor = 'system') {
  const units = ensureUnits();
  const bookings = ensureBookings();
  let booking = bookings.find((b) => b.id === input.booking_id);
  const unitId = booking?.unit_id || input.unit_id;
  const idx = units.findIndex((u) => u.id === unitId || u.code === unitId);
  if (idx < 0) return { ok: false, error: 'Ünite yok' };
  units[idx] = { ...units[idx], status: 'free', keyless: null, hk: 'dirty' };
  writeCollection('stay-units', units);
  if (booking) {
    const bidx = bookings.findIndex((b) => b.id === booking.id);
    bookings[bidx] = { ...bookings[bidx], status: 'checked_out', out_at: new Date().toISOString() };
    writeCollection('stay-bookings', bookings);
  }
  createStayHkTask({ unit_id: units[idx].id, kind: 'turnover', note: 'Checkout sonrası' }, actor);
  appendAudit({ actor, action: 'stay.checkout', detail: units[idx].code, meta: { unit_id: units[idx].id } });
  return { ok: true, unit: units[idx], overview: stayRingOverview() };
}

/** HK görevi tamamla → ünite clean */
export function completeStayHk(input = {}, actor = 'system') {
  const hk = ensureHk();
  const units = ensureUnits();
  let task = hk.find((t) => t.id === input.task_id);
  if (!task && input.unit_id) {
    task = hk.find((t) => (t.unit_id === input.unit_id || t.unit_code === input.unit_id) && t.status === 'open');
  }
  if (!task) {
    // açık görev yoksa üniteyi doğrudan temizle
    const idx = units.findIndex((u) => u.id === input.unit_id || u.code === input.unit_id);
    if (idx < 0) return { ok: false, error: 'HK görevi / ünite yok' };
    units[idx] = { ...units[idx], hk: 'clean' };
    writeCollection('stay-units', units);
    appendAudit({ actor, action: 'stay.hk_done', detail: units[idx].code, meta: { unit_id: units[idx].id } });
    return { ok: true, unit: units[idx], overview: stayRingOverview() };
  }
  const list = readCollection('stay-hk', []) || [];
  const tidx = list.findIndex((t) => t.id === task.id);
  if (tidx >= 0) {
    list[tidx] = { ...list[tidx], status: 'done', done_at: new Date().toISOString(), done_by: actor };
    writeCollection('stay-hk', list);
  }
  const uidx = units.findIndex((u) => u.id === task.unit_id);
  if (uidx >= 0) {
    units[uidx] = { ...units[uidx], hk: 'clean' };
    writeCollection('stay-units', units);
  }
  appendAudit({
    actor,
    action: 'stay.hk_done',
    detail: `${task.unit_code} · ${task.kind}`,
    meta: { id: task.id },
  });
  return { ok: true, task: list[tidx] || task, overview: stayRingOverview() };
}

/** Misafir amenity / istek → DAZE-CREW veya HEPHAESTUS */
export function createStayGuestRequest(input = {}, actor = 'system') {
  const units = ensureUnits();
  const unit =
    units.find((u) => u.id === input.unit_id || u.code === input.unit_id) ||
    units.find((u) => u.status === 'occupied') ||
    units[0];
  if (!unit) return { ok: false, error: 'Ünite yok' };
  const kind = input.kind || 'amenity';
  const row = {
    id: rid('sgr'),
    unit_id: unit.id,
    unit_code: unit.code,
    kind,
    note: input.note || 'Ek yastık / su',
    status: 'open',
    priority: input.priority || 'normal',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('stay-guest-requests', row, 300);
  const agent = kind === 'maintenance' || kind === 'hk' ? 'HEPHAESTUS' : 'DAZE-CREW';
  enqueueAgentJob(
    {
      agent,
      title: `stay request · ${unit.code} · ${kind}`,
      priority: row.priority === 'high' ? 'high' : 'normal',
      payload: { request_id: row.id, unit_id: unit.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'stay.guest_request',
    detail: `${unit.code} · ${kind}`,
    meta: { id: row.id },
  });
  return { ok: true, request: row, overview: stayRingOverview() };
}

export function completeStayGuestRequest(input = {}, actor = 'system') {
  const list = readCollection('stay-guest-requests', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'İstek yok' };
  let idx = list.findIndex((r) => r.id === input.id && r.status === 'open');
  if (idx < 0) idx = list.findIndex((r) => r.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık istek yok' };
  list[idx] = {
    ...list[idx],
    status: 'done',
    done_at: new Date().toISOString(),
    done_by: actor,
  };
  writeCollection('stay-guest-requests', list);
  appendAudit({
    actor,
    action: 'stay.guest_request_done',
    detail: list[idx].unit_code,
    meta: { id: list[idx].id },
  });
  return { ok: true, request: list[idx], overview: stayRingOverview() };
}

function folioBalance(charges = []) {
  const open = charges.filter((c) => c.status === 'open');
  const total = open.reduce((s, c) => s + (Number(c.amount_try) || 0), 0);
  return { open_count: open.length, balance_try: total, open };
}

/** Folio satırı — gece / amenity / hasar / late checkout */
export function postStayFolioCharge(input = {}, actor = 'system') {
  const units = ensureUnits();
  const bookings = ensureBookings();
  const booking =
    bookings.find((b) => b.id === input.booking_id) ||
    bookings.find((b) => b.status === 'confirmed' || b.status === 'checked_in') ||
    null;
  const unit =
    units.find((u) => u.id === input.unit_id || u.code === input.unit_id) ||
    units.find((u) => u.id === booking?.unit_id) ||
    units.find((u) => u.status === 'occupied') ||
    units[0];
  if (!unit) return { ok: false, error: 'Ünite yok' };
  const kind = input.kind || 'lodging';
  let amount = Number(input.amount_try);
  if (!Number.isFinite(amount) || amount <= 0) {
    if (kind === 'lodging') amount = Number(unit.rate_try) || 0;
    else if (kind === 'amenity') amount = Number(input.amount_try) || 250;
    else if (kind === 'late_checkout') amount = Math.round((Number(unit.rate_try) || 0) * 0.3);
    else if (kind === 'damage' || kind === 'keyless') amount = Number(input.amount_try) || 1500;
    else amount = 500;
  }
  if (amount <= 0) return { ok: false, error: 'Geçersiz tutar' };
  const charge = {
    id: rid('sfc'),
    unit_id: unit.id,
    unit_code: unit.code,
    booking_id: booking?.id || input.booking_id || null,
    guest: input.guest || booking?.guest || unit.guest || 'misafir',
    kind,
    amount_try: amount,
    note: input.note || kind,
    status: 'open',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('stay-folio-charges', charge, 500);
  appendAudit({
    actor,
    action: 'stay.folio_charge',
    detail: `${unit.code} · ${kind} · ${amount} TRY`,
    meta: { id: charge.id },
  });
  return { ok: true, charge, overview: stayRingOverview() };
}

/** Aktif occupancy için otomatik lodging folio */
export function autoPostStayFolio(input = {}, actor = 'system') {
  const units = ensureUnits();
  const bookings = ensureBookings();
  const posted = [];
  const targets = units.filter((u) => u.status === 'occupied' || u.status === 'wintering');
  for (const unit of targets) {
    if (input.unit_id && unit.id !== input.unit_id && unit.code !== input.unit_id) continue;
    const booking = bookings.find(
      (b) => b.unit_id === unit.id && (b.status === 'confirmed' || b.status === 'checked_in'),
    );
    const nights = Number(input.nights) || Number(booking?.nights) || 1;
    const amount = (Number(unit.rate_try) || 0) * nights;
    const res = postStayFolioCharge(
      {
        unit_id: unit.id,
        booking_id: booking?.id,
        kind: 'lodging',
        amount_try: amount,
        note: `${nights} gece · otomatik`,
        guest: booking?.guest,
      },
      actor,
    );
    if (res.ok) posted.push(res.charge);
  }
  if (!posted.length) return { ok: false, error: 'Yazılacak dolu ünite yok' };
  appendAudit({
    actor,
    action: 'stay.folio_auto',
    detail: `${posted.length} satır`,
    meta: { n: posted.length },
  });
  return { ok: true, posted, overview: stayRingOverview() };
}

/** Açık folio tahsilatı */
export function settleStayFolio(input = {}, actor = 'system') {
  const charges = readCollection('stay-folio-charges', []) || [];
  if (!Array.isArray(charges) || !charges.length) return { ok: false, error: 'Folio yok' };
  const unitId = input.unit_id;
  const bookingId = input.booking_id;
  const openIdx = [];
  for (let i = 0; i < charges.length; i++) {
    const c = charges[i];
    if (c.status !== 'open') continue;
    if (unitId && c.unit_id !== unitId && c.unit_code !== unitId) continue;
    if (bookingId && c.booking_id !== bookingId) continue;
    if (input.charge_id && c.id !== input.charge_id) continue;
    openIdx.push(i);
  }
  if (!openIdx.length) return { ok: false, error: 'Açık folio yok' };
  let total = 0;
  const settled = [];
  for (const i of openIdx) {
    total += Number(charges[i].amount_try) || 0;
    charges[i] = {
      ...charges[i],
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_by: actor,
      method: input.method || 'card',
    };
    settled.push(charges[i]);
  }
  writeCollection('stay-folio-charges', charges);
  const settlement = {
    id: rid('sfs'),
    unit_id: settled[0]?.unit_id,
    booking_id: bookingId || settled[0]?.booking_id || null,
    charge_ids: settled.map((c) => c.id),
    amount_try: total,
    method: input.method || 'card',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('stay-folio-settlements', settlement, 200);
  enqueueAgentJob(
    {
      agent: 'MINT',
      title: `stay folio settle · ${settled[0]?.unit_code || 'unit'} · ${total} TRY`,
      priority: 'normal',
      payload: { settlement_id: settlement.id, amount_try: total },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'stay.folio_settle',
    detail: `${settled.length} satır · ${total} TRY`,
    meta: { id: settlement.id },
  });
  return { ok: true, settlement, settled, overview: stayRingOverview() };
}

/** Gece doluluk + gelir rollup */
export function stayNightRollup(actor = 'system') {
  const units = ensureUnits();
  const bookings = ensureBookings();
  const occupied = units.filter((u) => u.status === 'occupied' || u.status === 'wintering');
  const free = units.filter((u) => u.status === 'free');
  const byType = {};
  let adrSum = 0;
  for (const u of occupied) {
    byType[u.type] = (byType[u.type] || 0) + 1;
    adrSum += Number(u.rate_try) || 0;
  }
  const confirmedNights = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((s, b) => s + (Number(b.nights) || 0), 0);
  const rollup = {
    id: rid('snr'),
    date: new Date().toISOString().slice(0, 10),
    occupied: occupied.length,
    free: free.length,
    wintering: units.filter((u) => u.status === 'wintering').length,
    occupancy_pct: units.length ? Math.round((occupied.length / units.length) * 100) : 0,
    revpar_try: units.length ? Math.round(adrSum / units.length) : 0,
    occupied_adr_try: occupied.length ? Math.round(adrSum / occupied.length) : 0,
    pipeline_nights: confirmedNights,
    byType,
    hk_open: (ensureHk() || []).filter((t) => t.status === 'open').length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('stay-night-rollups', rollup, 120);
  appendAudit({
    actor,
    action: 'stay.night_rollup',
    detail: `${rollup.occupancy_pct}% · RevPAR ${rollup.revpar_try}`,
    meta: { id: rollup.id },
  });
  return { ok: true, rollup, overview: stayRingOverview() };
}

function bookingCheckoutDate(booking) {
  if (!booking) return null;
  if (booking.checkout_date) return booking.checkout_date;
  const start = booking.check_in || (booking.at ? String(booking.at).slice(0, 10) : null);
  if (!start) return null;
  const nights = Number(booking.nights) || 1;
  return new Date(new Date(start).getTime() + nights * 86400_000).toISOString().slice(0, 10);
}

/** Gece audit — rollup + dolu üniteler için lodging folio */
export function runStayNightAudit(input = {}, actor = 'system') {
  const roll = stayNightRollup(actor);
  const folio = autoPostStayFolio({ nights: Number(input.nights) || 1 }, actor);
  const audit = {
    id: rid('sna'),
    date: new Date().toISOString().slice(0, 10),
    occupancy_pct: roll.rollup?.occupancy_pct ?? 0,
    occupied_adr_try: roll.rollup?.occupied_adr_try ?? 0,
    revpar_try: roll.rollup?.revpar_try ?? 0,
    folio_posted: folio.ok ? folio.posted?.length || 0 : 0,
    folio_ok: !!folio.ok,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('stay-night-audits', audit, 120);
  enqueueAgentJob(
    {
      agent: 'DAZE-CREW',
      title: `night audit · %${audit.occupancy_pct} · folio ${audit.folio_posted}`,
      priority: 'normal',
      payload: { audit_id: audit.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'stay.night_audit',
    detail: `${audit.date} · %${audit.occupancy_pct} · ${audit.folio_posted} folio`,
    meta: { id: audit.id },
  });
  return {
    ok: true,
    audit,
    rollup: roll.rollup,
    folio: folio.ok ? folio : { ok: false, error: folio.error },
    overview: stayRingOverview(),
  };
}

export function runStayringSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = stayRingOverview();
  const existing = readCollection('stayring-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  const orchestration = {
    overstay: flagStayOverstay({ force: force && input.flag_overstay !== false }, actor),
    hk: null,
    audit: null,
  };
  const nextOverview = stayRingOverview();
  if ((force || (nextOverview.summary?.hk_backlog || 0) > 0) && input.hk !== false) {
    const dirty = (nextOverview.units || []).find((u) => u.hk === 'dirty' || u.hk === 'inspect');
    if (dirty) orchestration.hk = createStayHkTask({ unit_id: dirty.id, kind: 'sweep_turnover' }, actor);
  }
  if (force || input.audit) orchestration.audit = runStayNightAudit({ nights: input.nights || 1 }, actor);
  const finalOverview = stayRingOverview();
  if (force || (finalOverview.summary?.aging_stays || 0) > 0 || orchestration.overstay?.ok) {
    candidates.push({
      key: 'stayring_aging_stays',
      level: (finalOverview.summary?.aging_stays || 0) > 0 || orchestration.overstay?.ok ? 'alert' : 'info',
      text: `Aging/overstay konaklama ${finalOverview.summary?.aging_stays || 0}`,
      domain: 'aging',
    });
  }
  if (force || (finalOverview.summary?.hk_backlog || 0) > 0) {
    candidates.push({
      key: 'stayring_hk_backlog',
      level: (finalOverview.summary?.hk_backlog || 0) > 0 ? 'warn' : 'info',
      text: `HK backlog ${finalOverview.summary?.hk_backlog || 0}`,
      domain: 'housekeeping',
    });
  }
  if (
    force ||
    (finalOverview.summary?.folio_open || 0) > 0 ||
    (finalOverview.summary?.folio_disputes_open || 0) > 0
  ) {
    candidates.push({
      key: 'stayring_folio_signals',
      level: (finalOverview.summary?.folio_disputes_open || 0) > 0 ? 'alert' : 'warn',
      text: `Folio açık ${finalOverview.summary?.folio_open || 0} · itiraz ${finalOverview.summary?.folio_disputes_open || 0}`,
      domain: 'folio',
    });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('srf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('stayring-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'DAZE-CREW',
        title: `stayring sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id), orchestration },
      },
      actor,
    );
  }
  const sweep = { id: rid('srs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('stayring-sweeps', sweep, 80);
  appendAudit({ actor, action: 'stayring.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, orchestration, overview: stayRingOverview() };
}

export function ackStayringFlag(input = {}, actor = 'system') {
  const list = readCollection('stayring-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('stayring-flags', list);
  appendAudit({ actor, action: 'stayring.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: stayRingOverview() };
}

/** Checkout geçmiş dolu üniteleri overstay olarak işaretle */
export function flagStayOverstay(input = {}, actor = 'system') {
  const units = ensureUnits();
  const bookings = ensureBookings();
  const today = (input.as_of || new Date().toISOString()).slice(0, 10);
  const existing = readCollection('stay-overstays', []) || [];
  const openIds = new Set(
    (Array.isArray(existing) ? existing : [])
      .filter((o) => o.status === 'open')
      .map((o) => o.unit_id),
  );
  const flagged = [];
  const occupied = units.filter((u) => u.status === 'occupied');
  for (const unit of occupied) {
    if (input.unit_id && unit.id !== input.unit_id && unit.code !== input.unit_id) continue;
    const booking =
      bookings.find(
        (b) =>
          b.unit_id === unit.id &&
          (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'overstay'),
      ) || null;
    const checkout = bookingCheckoutDate(booking);
    const pastDue = checkout ? checkout < today : false;
    if (!pastDue && !input.force) continue;
    if (openIds.has(unit.id) && !input.force) continue;
    const row = {
      id: rid('sos'),
      unit_id: unit.id,
      unit_code: unit.code,
      booking_id: booking?.id || null,
      guest: booking?.guestName || unit.guest || 'Misafir',
      checkout_date: checkout,
      status: 'open',
      reason: pastDue ? 'past_checkout' : 'force',
      at: new Date().toISOString(),
      actor,
    };
    flagged.push(row);
    if (booking) {
      const bidx = bookings.findIndex((b) => b.id === booking.id);
      if (bidx >= 0) {
        bookings[bidx] = { ...bookings[bidx], status: 'overstay', overstay_at: row.at };
      }
    }
    const uidx = units.findIndex((u) => u.id === unit.id);
    if (uidx >= 0) {
      units[uidx] = { ...units[uidx], overstay: true, overstay_id: row.id };
    }
  }
  if (!flagged.length && input.force) {
    const unit = occupied[0] || units.find((u) => u.status === 'wintering');
    if (!unit) return { ok: false, error: 'Dolu ünite yok' };
    const booking = bookings.find((b) => b.unit_id === unit.id) || null;
    const row = {
      id: rid('sos'),
      unit_id: unit.id,
      unit_code: unit.code,
      booking_id: booking?.id || null,
      guest: booking?.guestName || 'Misafir',
      checkout_date: bookingCheckoutDate(booking),
      status: 'open',
      reason: 'force',
      at: new Date().toISOString(),
      actor,
    };
    flagged.push(row);
    const uidx = units.findIndex((u) => u.id === unit.id);
    if (uidx >= 0) units[uidx] = { ...units[uidx], overstay: true, overstay_id: row.id };
  }
  if (!flagged.length) return { ok: false, error: 'Overstay yok' };
  writeCollection('stay-units', units);
  writeCollection('stay-bookings', bookings);
  for (const row of flagged) prependItem('stay-overstays', row, 200);
  enqueueAgentJob(
    {
      agent: 'DAZE-CREW',
      title: `overstay · ${flagged.length} ünite`,
      priority: 'high',
      payload: { ids: flagged.map((f) => f.id) },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'stay.overstay_flag',
    detail: `${flagged.length} ünite`,
    meta: { ids: flagged.map((f) => f.id) },
  });
  return { ok: true, flagged, overview: stayRingOverview() };
}

/** Overstay çöz — late checkout folio + checkout veya uzat */
export function resolveStayOverstay(input = {}, actor = 'system') {
  const list = readCollection('stay-overstays', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Overstay yok' };
  let idx = list.findIndex((o) => o.id === input.id && o.status === 'open');
  if (idx < 0) idx = list.findIndex((o) => o.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık overstay yok' };
  const row = list[idx];
  const mode = input.mode || 'checkout'; // checkout | extend
  let folio = null;
  let checkout = null;
  let booking = null;
  if (mode === 'extend') {
    const bookings = ensureBookings();
    const bidx = bookings.findIndex((b) => b.id === row.booking_id);
    const extra = Number(input.extra_nights) || 1;
    if (bidx >= 0) {
      const nights = (Number(bookings[bidx].nights) || 0) + extra;
      const base = bookings[bidx].checkout_date || bookingCheckoutDate(bookings[bidx]);
      const nextCheckout = new Date(new Date(base || Date.now()).getTime() + extra * 86400_000)
        .toISOString()
        .slice(0, 10);
      bookings[bidx] = {
        ...bookings[bidx],
        nights,
        checkout_date: nextCheckout,
        status: 'confirmed',
        extended_at: new Date().toISOString(),
      };
      writeCollection('stay-bookings', bookings);
      booking = bookings[bidx];
    }
    folio = postStayFolioCharge(
      {
        unit_id: row.unit_id,
        booking_id: row.booking_id,
        kind: 'lodging',
        note: `uzatma · ${extra} gece`,
        guest: row.guest,
      },
      actor,
    );
    const units = ensureUnits();
    const uidx = units.findIndex((u) => u.id === row.unit_id);
    if (uidx >= 0) {
      units[uidx] = { ...units[uidx], overstay: false, overstay_id: null };
      writeCollection('stay-units', units);
    }
  } else {
    folio = postStayFolioCharge(
      {
        unit_id: row.unit_id,
        booking_id: row.booking_id,
        kind: 'late_checkout',
        note: 'overstay late checkout',
        guest: row.guest,
      },
      actor,
    );
    checkout = checkoutStay({ unit_id: row.unit_id, booking_id: row.booking_id }, actor);
  }
  list[idx] = {
    ...row,
    status: 'resolved',
    resolve_mode: mode,
    resolved_at: new Date().toISOString(),
    resolved_by: actor,
    folio_charge_id: folio?.charge?.id || null,
  };
  writeCollection('stay-overstays', list);
  appendAudit({
    actor,
    action: 'stay.overstay_resolve',
    detail: `${row.unit_code} · ${mode}`,
    meta: { id: row.id },
  });
  return {
    ok: true,
    overstay: list[idx],
    folio,
    checkout,
    booking,
    overview: stayRingOverview(),
  };
}

/** Geç çıkış planla — ekstra saat + folio ücret */
export function scheduleStayLateCheckout(input = {}, actor = 'system') {
  const units = ensureUnits();
  const bookings = ensureBookings();
  let booking = bookings.find((b) => b.id === input.booking_id && b.status !== 'checked_out');
  if (!booking) {
    booking = bookings.find(
      (b) =>
        (b.status === 'checked_in' || b.status === 'confirmed' || b.status === 'active') &&
        (!input.unit_id || b.unit_id === input.unit_id),
    );
  }
  const unit =
    units.find((u) => u.id === (booking?.unit_id || input.unit_id) || u.code === input.unit_id) ||
    units.find((u) => u.status === 'occupied');
  if (!unit) return { ok: false, error: 'Ünite yok' };
  const hours = Math.min(12, Math.max(1, Number(input.hours) || 2));
  const fee = Number(input.fee_try) || Math.round((Number(unit.rate_try) || 2000) * (hours / 24));
  const until = new Date(Date.now() + hours * 3600_000).toISOString();
  const late = {
    id: rid('slc'),
    unit_id: unit.id,
    unit_code: unit.code,
    booking_id: booking?.id || null,
    hours,
    fee_try: fee,
    until,
    status: 'scheduled',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('stay-late-checkouts', late, 120);
  const uidx = units.findIndex((u) => u.id === unit.id);
  units[uidx] = { ...units[uidx], late_checkout_until: until, late_checkout_id: late.id };
  writeCollection('stay-units', units);
  if (booking) {
    const bidx = bookings.findIndex((b) => b.id === booking.id);
    if (bidx >= 0) {
      bookings[bidx] = { ...bookings[bidx], late_checkout_until: until, late_checkout_id: late.id };
      writeCollection('stay-bookings', bookings);
    }
  }
  let charge = null;
  if (fee > 0) {
    const posted = postStayFolioCharge(
      {
        unit_id: unit.id,
        booking_id: booking?.id,
        kind: 'late_checkout',
        amount_try: fee,
        note: `Geç çıkış ${hours}s`,
      },
      actor,
    );
    if (posted.ok) charge = posted.charge;
  }
  enqueueAgentJob(
    {
      agent: 'DAZE-CREW',
      title: `late checkout · ${unit.code} · ${hours}s`,
      priority: 'normal',
      payload: { late_id: late.id, unit_id: unit.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'stay.late_checkout',
    detail: `${unit.code} · ${hours}s · ${fee} TRY`,
    meta: { id: late.id },
  });
  return { ok: true, late, charge, overview: stayRingOverview() };
}

/** Folio satır itirazı */
export function disputeStayFolioCharge(input = {}, actor = 'system') {
  const charges = readCollection('stay-folio-charges', []) || [];
  if (!Array.isArray(charges) || !charges.length) return { ok: false, error: 'Folio yok' };
  let idx = charges.findIndex((c) => c.id === input.charge_id && c.status === 'open');
  if (idx < 0) {
    idx = charges.findIndex(
      (c) =>
        c.status === 'open' &&
        (!input.unit_id || c.unit_id === input.unit_id || c.unit_code === input.unit_id),
    );
  }
  if (idx < 0) return { ok: false, error: 'Açık folio satırı yok' };
  charges[idx] = {
    ...charges[idx],
    status: 'disputed',
    dispute_reason: String(input.reason || 'guest_dispute').slice(0, 240),
    disputed_at: new Date().toISOString(),
    disputed_by: actor,
  };
  writeCollection('stay-folio-charges', charges);
  const dispute = {
    id: rid('sfd'),
    charge_id: charges[idx].id,
    unit_id: charges[idx].unit_id,
    amount_try: charges[idx].amount_try,
    reason: charges[idx].dispute_reason,
    status: 'open',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('stay-folio-disputes', dispute, 120);
  enqueueAgentJob(
    {
      agent: 'MINT',
      title: `folio dispute · ${charges[idx].unit_code || charges[idx].unit_id} · ${charges[idx].amount_try} TRY`,
      priority: 'high',
      payload: { dispute_id: dispute.id, charge_id: charges[idx].id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'stay.folio_dispute',
    detail: `${charges[idx].id} · ${charges[idx].amount_try}`,
    meta: { id: dispute.id },
  });
  return { ok: true, charge: charges[idx], dispute, overview: stayRingOverview() };
}

/** Keyless kod iptal */
export function revokeStayKeyless(input = {}, actor = 'system') {
  const keys = ensureKeys();
  let idx = keys.findIndex((k) => k.id === input.id && k.status === 'active');
  if (idx < 0) {
    idx = keys.findIndex(
      (k) =>
        k.status === 'active' &&
        (!input.unit_id || k.unit_id === input.unit_id || k.unit_code === input.unit_id) &&
        (!input.code || k.code === input.code),
    );
  }
  if (idx < 0) return { ok: false, error: 'Aktif key yok' };
  keys[idx] = {
    ...keys[idx],
    status: 'revoked',
    revoked_at: new Date().toISOString(),
    revoked_by: actor,
    revoke_reason: String(input.reason || 'security').slice(0, 240),
  };
  writeCollection('stay-keys', keys);
  const units = ensureUnits();
  const uidx = units.findIndex((u) => u.id === keys[idx].unit_id);
  if (uidx >= 0 && units[uidx].keyless === keys[idx].code) {
    units[uidx] = { ...units[uidx], keyless: null };
    writeCollection('stay-units', units);
  }
  const revoke = {
    id: rid('skr'),
    key_id: keys[idx].id,
    unit_id: keys[idx].unit_id,
    code: keys[idx].code,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('stay-key-revocations', revoke, 120);
  enqueueAgentJob(
    {
      agent: 'NEXUS',
      title: `keyless revoke · ${keys[idx].unit_code || keys[idx].unit_id}`,
      priority: 'high',
      payload: { revoke_id: revoke.id, key_id: keys[idx].id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'stay.keyless_revoke',
    detail: keys[idx].code,
    meta: { id: revoke.id },
  });
  return { ok: true, key: keys[idx], revoke, overview: stayRingOverview() };
}
