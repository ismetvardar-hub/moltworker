/**
 * Adım 8 — Aile & çocuk: kamp, yaz okulu, güvenli emanet.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`; }

function ensurePrograms() {
  let list = readCollection('family-programs', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'fp_1', kind: 'summer_school', title: 'Yaz Okulu Trail Kids', ages: '7-12', seats: 24, booked: 18, status: 'open' },
      { id: 'fp_2', kind: 'camp', title: 'Hafta Sonu Aile Kampı', ages: 'all', seats: 40, booked: 40, status: 'full' },
      { id: 'fp_3', kind: 'daycare', title: 'Güvenli Emanet (yarım gün)', ages: '4-10', seats: 16, booked: 9, status: 'open' },
    ];
    writeCollection('family-programs', list);
  }
  return list;
}

function ensureCheckins() {
  const list = readCollection('family-checkins', null);
  return Array.isArray(list) ? list : [];
}

export function familyCampOverview() {
  const programs = ensurePrograms();
  const checkins = ensureCheckins();
  return {
    title: 'Aile & Çocuk',
    programs,
    checkins: checkins.slice(0, 20),
    summary: {
      open: programs.filter((p) => p.status === 'open').length,
      full: programs.filter((p) => p.status === 'full').length,
      in_care: checkins.filter((c) => c.status === 'in_care').length,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function familyCheckIn(input = {}, actor = 'system') {
  const row = {
    id: rid('fc'),
    child_name: input.child_name || 'Çocuk',
    guardian: input.guardian || 'Veli',
    program_id: input.program_id || 'fp_3',
    status: 'in_care',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('family-checkins', row, 300);
  appendAudit({ actor, action: 'family.checkin', detail: `${row.child_name} · ${row.guardian}`, meta: { id: row.id } });
  return { ok: true, checkin: row, overview: familyCampOverview() };
}

export function familyCheckOut(id, actor = 'system') {
  const list = ensureCheckins();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) {
    // allow checkout of latest in_care
    const live = list.findIndex((c) => c.status === 'in_care');
    if (live < 0) return { ok: false, error: 'Açık emanet yok' };
    list[live] = { ...list[live], status: 'returned', out_at: new Date().toISOString() };
    writeCollection('family-checkins', list);
    appendAudit({ actor, action: 'family.checkout', detail: list[live].child_name, meta: { id: list[live].id } });
    return { ok: true, checkin: list[live], overview: familyCampOverview() };
  }
  list[idx] = { ...list[idx], status: 'returned', out_at: new Date().toISOString() };
  writeCollection('family-checkins', list);
  appendAudit({ actor, action: 'family.checkout', detail: list[idx].child_name, meta: { id } });
  return { ok: true, checkin: list[idx], overview: familyCampOverview() };
}
