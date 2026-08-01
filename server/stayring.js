/**
 * Adım 3+ — Konaklama halkası: glamping / karavan / bungalow + keyless / kışlama / HK.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';

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
  return {
    title: 'Konaklama Halkası',
    units,
    bookings: bookings.slice(0, 30),
    keys: keys.slice(0, 20),
    hk: hk.slice(0, 20),
    summary: {
      free: units.filter((u) => u.status === 'free').length,
      occupied: units.filter((u) => u.status === 'occupied').length,
      wintering: units.filter((u) => u.status === 'wintering').length,
      hold: units.filter((u) => u.status === 'hold').length,
      hk_dirty: units.filter((u) => u.hk === 'dirty' || u.hk === 'inspect').length,
      keys_active: keys.filter((k) => k.status === 'active').length,
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
