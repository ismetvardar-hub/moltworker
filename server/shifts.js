/**
 * AŞAMA 24 — Crew vardiya planı.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_SHIFTS = () => {
  const day = todayIso();
  return [
    {
      id: 'sh_1',
      date: day,
      role: 'Vardiya Şefi',
      person: 'Ayşe T.',
      start: '08:00',
      end: '16:00',
      venueId: 'venue_olympos_beach',
      brandId: 'brand_daze',
      status: 'scheduled',
    },
    {
      id: 'sh_2',
      date: day,
      role: 'Kapı Görevlisi',
      person: 'Selin M.',
      start: '12:00',
      end: '20:00',
      venueId: 'venue_olympos_beach',
      brandId: 'brand_olympospass',
      status: 'scheduled',
    },
    {
      id: 'sh_3',
      date: day,
      role: 'Mutfak Yardımcısı',
      person: 'Kaan Y.',
      start: '12:00',
      end: '20:00',
      venueId: 'venue_kaleici',
      brandId: 'brand_daze',
      status: 'scheduled',
    },
  ];
};

function ensureSeed() {
  const list = readCollection('shifts', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = DEFAULT_SHIFTS();
    writeCollection('shifts', seed);
    return seed;
  }
  return list;
}

export function listShifts(filter = {}) {
  let list = ensureSeed();
  if (filter.date) list = list.filter((s) => s.date === filter.date);
  if (filter.venueId) list = list.filter((s) => s.venueId === filter.venueId);
  if (filter.brandId) list = list.filter((s) => s.brandId === filter.brandId);
  return list.sort((a, b) => a.start.localeCompare(b.start));
}

export function createShift(input, actor = 'system') {
  const shift = {
    id: `sh_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    date: input.date || todayIso(),
    role: input.role || 'Personel',
    person: input.person || 'Atanmamış',
    start: input.start || '09:00',
    end: input.end || '17:00',
    venueId: input.venueId || null,
    brandId: input.brandId || 'brand_daze',
    status: input.status || 'scheduled',
    createdAt: new Date().toISOString(),
  };
  prependItem('shifts', shift, 200);
  appendAudit({
    actor,
    action: 'shifts.create',
    detail: `${shift.person} ${shift.date} ${shift.start}-${shift.end}`,
    meta: { id: shift.id },
  });
  return shift;
}

export function updateShift(id, patch, actor = 'system') {
  const list = ensureSeed();
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('shifts', list);
  appendAudit({
    actor,
    action: 'shifts.update',
    detail: `${list[idx].person} → ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function removeShift(id, actor = 'system') {
  const s = ensureSeed().find((x) => x.id === id);
  if (!s) return null;
  deleteItem('shifts', id);
  appendAudit({
    actor,
    action: 'shifts.delete',
    detail: s.person,
    meta: { id },
  });
  return s;
}

export function shiftsSummary() {
  const today = todayIso();
  const all = listShifts();
  const todayList = all.filter((s) => s.date === today);
  return {
    today,
    todayCount: todayList.length,
    total: all.length,
    shifts: todayList,
  };
}
