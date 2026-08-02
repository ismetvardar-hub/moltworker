/**
 * AŞAMA 58 — Tesis çalışma saatleri.
 */
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

const DEFAULT = [
  {
    venueId: 'venue_olympos_beach',
    name: 'Olympos Beach',
    open: '10:00',
    close: '02:00',
    days: 'Her gün',
    seasonalNote: 'Yaz sezonu',
    status: 'open',
  },
  {
    venueId: 'venue_kaleici',
    name: 'Kaleiçi',
    open: '11:00',
    close: '23:00',
    days: 'Pzt–Paz',
    seasonalNote: '',
    status: 'open',
  },
  {
    venueId: 'venue_phaseelis',
    name: 'Phaselis Lounge',
    open: '12:00',
    close: '00:00',
    days: 'Cum–Paz',
    seasonalNote: 'Hafta sonu',
    status: 'open',
  },
];

function ensure() {
  const list = readCollection('venue-hours', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('venue-hours', DEFAULT);
    return DEFAULT.map((h) => ({ ...h }));
  }
  return list;
}

export function listHours() {
  return ensure();
}

export function updateHours(venueId, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((h) => h.venueId === venueId);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, venueId, updatedAt: new Date().toISOString() };
  writeCollection('venue-hours', list);
  appendAudit({
    actor,
    action: 'hours.update',
    detail: `${list[idx].name}: ${list[idx].open}–${list[idx].close}`,
    meta: { venueId },
  });
  return list[idx];
}

export function hoursSummary() {
  const hours = listHours();
  const closed = hours.filter((h) => h.status === 'closed' || h.open === 'closed').length;
  const withHoliday = hours.filter((h) => h.seasonalNote || h.holidayNote).length;
  const flags = readCollection('hours-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    title: 'LİKYA Çalışma Saatleri',
    generatedAt: new Date().toISOString(),
    venues: hours.length,
    hours,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      venues: hours.length,
      closed,
      holiday_notes: withHoliday,
    },
    summaryLines: [
      `${hours.length} tesis · kapalı ${closed}`,
      `Tatil notu ${withHoliday} · flag ${openFlags.length} açık`,
    ],
  };
}

export function runHoursSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = hoursSummary();
  const existing = readCollection('hours-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.summary?.closed || 0) > 0) {
    candidates.push({
      key: 'closed_venues',
      level: (o.summary?.closed || 0) > 0 ? 'warn' : 'info',
      text: `Kapalı tesis ${o.summary?.closed || 0}`,
      domain: 'status',
    });
  }
  if (force || (o.summary?.venues || 0) < 2) {
    candidates.push({
      key: 'coverage',
      level: 'info',
      text: `Saat kaydı ${o.summary?.venues || 0}`,
      domain: 'coverage',
    });
  }
  if (force || (o.summary?.holiday_notes || 0) === 0) {
    candidates.push({
      key: 'holiday',
      level: 'info',
      text: `Tatil notu ${o.summary?.holiday_notes || 0}`,
      domain: 'holiday',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Hours heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('hrsf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('hours-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `hours sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('hrss'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('hours-sweeps', sweep, 80);
  appendAudit({ actor, action: 'hours.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: hoursSummary() };
}

export function ackHoursFlag(input = {}, actor = 'system') {
  const list = readCollection('hours-flags', []) || [];
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
  writeCollection('hours-flags', list);
  appendAudit({ actor, action: 'hours.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: hoursSummary() };
}

export function openVenueHours(input = {}, actor = 'system') {
  const hours = listHours();
  const opened = [];
  const targets = hours.filter((h) => h.status === 'closed' || input.venueId === h.venueId);
  const pool = targets.length ? targets : hours;
  for (const h of pool.slice(0, Number(input.limit) || 20)) {
    if (input.venueId && h.venueId !== input.venueId) continue;
    const next = updateHours(
      h.venueId,
      {
        status: 'open',
        open: input.open || h.open || '10:00',
        close: input.close || h.close || '23:00',
      },
      actor,
    );
    if (next) opened.push(next.venueId);
  }
  if (!opened.length && hours[0]) {
    const next = updateHours(hours[0].venueId, { status: 'open' }, actor);
    if (next) opened.push(next.venueId);
  }
  appendAudit({ actor, action: 'hours.open', detail: `${opened.length}`, meta: { n: opened.length } });
  return { ok: true, opened, overview: hoursSummary() };
}

export function closeVenueHours(input = {}, actor = 'system') {
  const hours = listHours();
  const closed = [];
  for (const h of hours.slice(0, Number(input.limit) || 20)) {
    if (input.venueId && h.venueId !== input.venueId) continue;
    if (!input.venueId && h.status === 'closed') continue;
    const next = updateHours(
      h.venueId,
      { status: 'closed', seasonalNote: input.note || h.seasonalNote || 'Kapalı' },
      actor,
    );
    if (next) closed.push(next.venueId);
    if (!input.force && closed.length >= 1 && !input.venueId) break;
  }
  if (!closed.length && hours[0]) {
    const next = updateHours(hours[0].venueId, { status: 'closed' }, actor);
    if (next) closed.push(next.venueId);
  }
  appendAudit({ actor, action: 'hours.close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: hoursSummary() };
}

export function applyHolidayNote(input = {}, actor = 'system') {
  const hours = listHours();
  const note = String(input.note || 'Resmi tatil — özel saat').slice(0, 240);
  const updated = [];
  for (const h of hours.slice(0, Number(input.limit) || 20)) {
    if (input.venueId && h.venueId !== input.venueId) continue;
    const next = updateHours(
      h.venueId,
      { holidayNote: note, seasonalNote: note },
      actor,
    );
    if (next) updated.push(next.venueId);
    if (!input.force && !input.venueId && updated.length >= 1) break;
  }
  if (!updated.length && hours[0]) {
    const next = updateHours(hours[0].venueId, { holidayNote: note, seasonalNote: note }, actor);
    if (next) updated.push(next.venueId);
  }
  appendAudit({ actor, action: 'hours.holiday', detail: `${updated.length}`, meta: { n: updated.length } });
  return { ok: true, updated, note, overview: hoursSummary() };
}
