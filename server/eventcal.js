/**
 * Wave 165 - Event calendar ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('events-calendar', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
      {
        id: 'evt_1',
        title: 'Sunset DJ',
        date: '2026-08-01',
        venueId: 'venue_olympos_beach',
        status: 'planned',
        at: new Date().toISOString(),
      },
    ];
    writeCollection('events-calendar', seed);
    return seed;
  }
  return list;
}

function openEventcalFlags() {
  const flags = readCollection('eventcal-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addEventcalFlag(candidate, actor = 'system') {
  const existing = readCollection('eventcal-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('evf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('eventcal-flags', list.slice(0, 200));
  return flag;
}

function eventKey(row) {
  return `${row.date || ''}|${row.venueId || row.venue || ''}`;
}

function conflictEvents(list) {
  const seen = new Map();
  const conflicts = [];
  for (const row of list) {
    if (row.status === 'done' || row.status === 'cancelled') continue;
    if (row.status === 'conflict' || row.conflict === true) {
      conflicts.push(row);
      continue;
    }
    const key = eventKey(row);
    if (!key.trim() || key === '|') continue;
    if (seen.has(key)) {
      conflicts.push(row);
      const first = seen.get(key);
      if (first) conflicts.push(first);
    } else {
      seen.set(key, row);
    }
  }
  return [...new Map(conflicts.map((x) => [x.id, x])).values()];
}

export function listEventcal(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.date || b.at || '').localeCompare(String(a.date || a.at || '')));
}

export function createEventcal(input = {}, actor = 'system') {
  const row = {
    id: `evt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: String(input.title || '').trim() || 'Event',
    date: input.date || new Date().toISOString().slice(0, 10),
    venueId: input.venueId || input.venue || 'venue_olympos_beach',
    status: input.status || 'planned',
    note: input.note || '',
    publishedAt: input.publishedAt || null,
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('events-calendar', row, 300);
  appendAudit({
    actor,
    action: 'eventcal.create',
    detail: row.title,
    meta: { id: row.id },
  });
  return row;
}

export function updateEventcal(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('events-calendar', list);
  appendAudit({
    actor,
    action: 'eventcal.update',
    detail: `${list[idx].title} -> ${list[idx].status}`,
    meta: { id },
  });
  return list[idx];
}

export function eventcalSummary() {
  const list = listEventcal();
  const conflicts = conflictEvents(list);
  const holding = list.filter((x) => x.status === 'holding');
  const published = list.filter((x) => x.status === 'published' || x.publishedAt);
  const flags = openEventcalFlags();
  return {
    title: 'LIKYA Event Calendar Ops',
    total: list.length,
    planned: list.filter((x) => x.status === 'planned').length,
    live: list.filter((x) => x.status === 'live').length,
    done: list.filter((x) => x.status === 'done').length,
    holding: holding.length,
    published: published.length,
    conflicts: conflicts.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      planned: list.filter((x) => x.status === 'planned').length,
      live: list.filter((x) => x.status === 'live').length,
      done: list.filter((x) => x.status === 'done').length,
      holding: holding.length,
      published: published.length,
      conflicts: conflicts.length,
    },
    summaryLines: [
      `Event calendar ${list.length} event - planned ${list.filter((x) => x.status === 'planned').length} - conflict ${conflicts.length}`,
      `Holding ${holding.length} - published ${published.length} - flag ${flags.length}`,
    ],
    events: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runEventcalSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = eventcalSummary();
  const created = [];
  const candidates = [];
  if (force || overview.conflicts > 0) {
    candidates.push({
      key: 'eventcal_venue_conflict',
      level: overview.conflicts > 0 ? 'alert' : 'info',
      text: `Event calendar conflicts ${overview.conflicts}`,
      domain: 'conflict',
    });
  }
  if (force || overview.holding > 0) {
    candidates.push({
      key: 'eventcal_holding_events',
      level: overview.holding > 0 ? 'warn' : 'info',
      text: `Holding events ${overview.holding}`,
      domain: 'holding',
    });
  }
  if (force || overview.planned > overview.published) {
    candidates.push({
      key: 'eventcal_unpublished_planned',
      level: overview.planned > overview.published ? 'warn' : 'info',
      text: `Planned events ${overview.planned} / published ${overview.published}`,
      domain: 'publish',
    });
  }
  for (const candidate of candidates) {
    const flag = addEventcalFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `eventcal sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('evs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('eventcal-sweeps', sweep, 80);
  appendAudit({ actor, action: 'eventcal.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: eventcalSummary() };
}

export function ackEventcalFlag(input = {}, actor = 'system') {
  const list = readCollection('eventcal-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('eventcal-flags', list);
  appendAudit({ actor, action: 'eventcal.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: eventcalSummary() };
}

export function flagEventcalConflict(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'done' && x.status !== 'cancelled');
  if (idx < 0) return { ok: false, error: 'Conflict icin event yok' };
  list[idx] = {
    ...list[idx],
    status: 'conflict',
    conflict: true,
    conflictReason: input.reason || input.conflictReason || 'Venue/date conflict',
    date: input.date || list[idx].date,
    venueId: input.venueId || input.venue || list[idx].venueId,
    conflictAt: input.conflictAt || new Date().toISOString(),
    conflictBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('events-calendar', list);
  appendAudit({ actor, action: 'eventcal.conflict', detail: list[idx].title || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, event: list[idx], overview: eventcalSummary() };
}

export function publishEventcalEvent(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'planned' || x.status === 'holding');
  if (idx < 0) return { ok: false, error: 'Publish edilecek event yok' };
  list[idx] = {
    ...list[idx],
    status: 'published',
    publishedAt: input.publishedAt || new Date().toISOString(),
    publishedBy: actor,
    publishChannel: input.channel || input.publishChannel || 'guestapp',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('events-calendar', list);
  appendAudit({ actor, action: 'eventcal.publish', detail: list[idx].title || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, event: list[idx], overview: eventcalSummary() };
}

export function seedHoldingEventcalEvent(input = {}, actor = 'system') {
  const event = createEventcal(
    {
      title: input.title || 'Holding event',
      date: input.date || new Date(Date.now() + 24 * 60 * 60_000).toISOString().slice(0, 10),
      venueId: input.venueId || input.venue || 'venue_olympos_beach',
      status: 'holding',
      note: input.note || 'Holding pending venue confirmation',
    },
    actor,
  );
  appendAudit({ actor, action: 'eventcal.seed_holding_event', detail: event.title, meta: { id: event.id } });
  return { ok: true, event, overview: eventcalSummary() };
}
