/**
 * Adım 3 — Konaklama halkası: glamping / karavan / bungalow.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`; }

function ensureUnits() {
  let list = readCollection('stay-units', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'su_1', type: 'glamping', code: 'GL-01', capacity: 2, status: 'free', rate_try: 4500 },
      { id: 'su_2', type: 'glamping', code: 'GL-02', capacity: 4, status: 'occupied', rate_try: 6200 },
      { id: 'su_3', type: 'caravan', code: 'KV-07', capacity: 3, status: 'wintering', rate_try: 2800 },
      { id: 'su_4', type: 'caravan', code: 'KV-12', capacity: 3, status: 'free', rate_try: 2800 },
      { id: 'su_5', type: 'bungalow', code: 'BG-A1', capacity: 5, status: 'free', rate_try: 8900 },
      { id: 'su_6', type: 'bungalow', code: 'BG-A2', capacity: 5, status: 'hold', rate_try: 8900 },
    ];
    writeCollection('stay-units', list);
  }
  return list;
}

function ensureBookings() {
  const list = readCollection('stay-bookings', null);
  return Array.isArray(list) ? list : [];
}

export function stayRingOverview() {
  const units = ensureUnits();
  const bookings = ensureBookings();
  return {
    title: 'Konaklama Halkası',
    units,
    bookings: bookings.slice(0, 30),
    summary: {
      free: units.filter((u) => u.status === 'free').length,
      occupied: units.filter((u) => u.status === 'occupied').length,
      wintering: units.filter((u) => u.status === 'wintering').length,
      hold: units.filter((u) => u.status === 'hold').length,
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
  const unit = units.find((u) => u.id === input.unit_id || u.code === input.unit_id) || units.find((u) => u.status === 'free');
  if (!unit) return { ok: false, error: 'Müsait ünite yok' };
  if (unit.status !== 'free' && unit.status !== 'hold') return { ok: false, error: `Ünite müsait değil: ${unit.status}` };
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
  units[idx] = { ...units[idx], status: 'occupied' };
  writeCollection('stay-units', units);
  appendAudit({ actor, action: 'stay.book', detail: `${booking.unit_code} · ${booking.guestName}`, meta: { id: booking.id } });
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
