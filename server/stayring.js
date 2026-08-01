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

export function stayRingOverview() {
  const units = ensureUnits();
  const bookings = ensureBookings();
  const keys = ensureKeys();
  const hk = ensureHk();
  const rollups = readCollection('stay-night-rollups', []) || [];
  const lastRollup = Array.isArray(rollups) && rollups[0] ? rollups[0] : null;
  return {
    title: 'Konaklama Halkası',
    units,
    bookings: bookings.slice(0, 30),
    keys: keys.slice(0, 20),
    hk: hk.slice(0, 20),
    night_rollups: (Array.isArray(rollups) ? rollups : []).slice(0, 10),
    summary: {
      free: units.filter((u) => u.status === 'free').length,
      occupied: units.filter((u) => u.status === 'occupied').length,
      wintering: units.filter((u) => u.status === 'wintering').length,
      hold: units.filter((u) => u.status === 'hold').length,
      hk_dirty: units.filter((u) => u.hk === 'dirty' || u.hk === 'inspect').length,
      keys_active: keys.filter((k) => k.status === 'active').length,
      occupancy_pct: lastRollup?.occupancy_pct ?? null,
      revpar_try: lastRollup?.revpar_try ?? null,
      byType: {
        glamping: units.filter((u) => u.type === 'glamping').length,
        caravan: units.filter((u) => u.type === 'caravan').length,
        bungalow: units.filter((u) => u.type === 'bungalow').length,
      },
    },
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
  const booking = {
    id: rid('sb'),
    unit_id: unit.id,
    unit_code: unit.code,
    type: unit.type,
    guestName: input.guestName || 'Misafir',
    nights: Number(input.nights) || 2,
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
