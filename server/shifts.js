/**
 * AŞAMA 24 — Crew vardiya planı.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection, deleteItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

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

function isGap(s) {
  const person = String(s.person || '').trim().toLowerCase();
  return (
    s.status === 'open' ||
    s.status === 'gap' ||
    !person ||
    person === 'atanmamış' ||
    person === 'unassigned' ||
    person === '—'
  );
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
  const gaps = all.filter((s) => isGap(s)).length;
  const open = all.filter((s) => s.status === 'open' || s.status === 'scheduled' || s.status === 'confirmed').length;
  const closed = all.filter((s) => s.status === 'closed' || s.status === 'done').length;
  const flags = readCollection('shifts-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    today,
    todayCount: todayList.length,
    total: all.length,
    gaps,
    open,
    closed,
    shifts: todayList,
    title: 'LİKYA Vardiya',
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      today: todayList.length,
      gaps,
      open,
      closed,
    },
    summaryLines: [
      `Bugün ${todayList.length} · açık ${open} · boşluk ${gaps}`,
      `Shifts flag ${openFlags.length} açık`,
    ],
  };
}

export function runShiftsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = shiftsSummary();
  const existing = readCollection('shifts-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.gaps || 0) > 0) {
    candidates.push({
      key: 'gaps',
      level: 'alert',
      text: `Vardiya boşluğu ${o.gaps || 0}`,
      domain: 'gaps',
    });
  }
  if (force || (o.todayCount || 0) > 0) {
    candidates.push({
      key: 'today',
      level: 'info',
      text: `Bugünkü vardiya ${o.todayCount || 0}`,
      domain: 'today',
    });
  }
  if (force || (o.open || 0) > 0) {
    candidates.push({
      key: 'open',
      level: 'warn',
      text: `Açık/planlı vardiya ${o.open || 0}`,
      domain: 'open',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Shifts heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('shff'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('shifts-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `shifts sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('shfs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('shifts-sweeps', sweep, 80);
  appendAudit({ actor, action: 'shifts.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: shiftsSummary() };
}

export function ackShiftsFlag(input = {}, actor = 'system') {
  const list = readCollection('shifts-flags', []) || [];
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
  writeCollection('shifts-flags', list);
  appendAudit({ actor, action: 'shifts.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: shiftsSummary() };
}

/** Mutator 1 — open / cover gap. */
export function openCoverShiftGap(input = {}, actor = 'system') {
  const gaps = listShifts().filter((s) => isGap(s));
  const covered = [];
  const person = String(input.person || 'Cover Crew').trim();
  for (const row of gaps.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateShift(
      row.id,
      { person, status: 'confirmed', note: input.note || 'gap covered' },
      actor,
    );
    if (next) covered.push(next.id);
  }
  if (!covered.length) {
    const seeded = createShift(
      {
        role: input.role || 'Gap Cover',
        person: 'Atanmamış',
        status: 'open',
        start: input.start || '18:00',
        end: input.end || '02:00',
        venueId: input.venueId || 'venue_olympos_beach',
      },
      actor,
    );
    const next = updateShift(seeded.id, { person, status: 'confirmed' }, actor);
    if (next) covered.push(next.id);
    else covered.push(seeded.id);
  }
  appendAudit({ actor, action: 'shifts.cover_gap', detail: `${covered.length}`, meta: { n: covered.length } });
  return { ok: true, covered, overview: shiftsSummary() };
}

/** Mutator 2 — close shift. */
export function closeShiftOps(input = {}, actor = 'system') {
  const rows = listShifts().filter(
    (s) => s.status === 'scheduled' || s.status === 'confirmed' || s.status === 'open',
  );
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateShift(row.id, { status: 'closed', note: input.note || 'shift closed' }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createShift(
      { role: 'Close seed', person: 'Ops', status: 'confirmed' },
      actor,
    );
    const next = updateShift(seeded.id, { status: 'closed' }, actor);
    if (next) closed.push(next.id);
    else closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'shifts.close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: shiftsSummary() };
}

/** Mutator 3 — assign staff. */
export function assignShiftStaff(input = {}, actor = 'system') {
  const person = String(input.person || 'Assigned Staff').trim();
  const rows = listShifts().filter(
    (s) => isGap(s) || s.status === 'scheduled' || s.status === 'open',
  );
  const assigned = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateShift(
      row.id,
      { person, status: input.status || 'confirmed', role: input.role || row.role },
      actor,
    );
    if (next) assigned.push(next.id);
  }
  if (!assigned.length) {
    const seeded = createShift(
      {
        role: input.role || 'Personel',
        person: 'Atanmamış',
        status: 'scheduled',
        venueId: input.venueId || 'venue_olympos_beach',
      },
      actor,
    );
    const next = updateShift(seeded.id, { person, status: 'confirmed' }, actor);
    if (next) assigned.push(next.id);
    else assigned.push(seeded.id);
  }
  appendAudit({ actor, action: 'shifts.assign_staff', detail: `${assigned.length}`, meta: { n: assigned.length } });
  return { ok: true, assigned, overview: shiftsSummary() };
}
