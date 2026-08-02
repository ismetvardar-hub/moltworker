import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 168 - Meeting room booking ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('meeting-rooms', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'mee_1',
      room: "Athena",
      title: "Brifing",
      status: 'booked',
      startsAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      endsAt: new Date(Date.now() + 90 * 60_000).toISOString(),
      at: new Date().toISOString(),
    }];
    writeCollection('meeting-rooms', seed);
    return seed;
  }
  return list;
}

function openMeetingroomsFlags() {
  const flags = readCollection('meetingrooms-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addMeetingroomsFlag(candidate, actor = 'system') {
  const existing = readCollection('meetingrooms-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('mrf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('meetingrooms-flags', list.slice(0, 200));
  return flag;
}

function isBookingOverrun(row) {
  if (row.status === 'overrun') return true;
  if (row.status === 'done' || row.status === 'released') return false;
  const ends = Date.parse(row.endsAt || row.endAt || row.until || '');
  return (row.status === 'in_use' || row.status === 'booked') && Number.isFinite(ends) && ends < Date.now();
}

export function listMeetingrooms(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createMeetingrooms(input = {}, actor = 'system') {
  const row = {
    id: rid('mee'),
    room: input.room !== undefined ? input.room : "Athena",
    title: input.title !== undefined ? input.title : "Brifing",
    organizer: input.organizer || null,
    startsAt: input.startsAt || input.startAt || null,
    endsAt: input.endsAt || input.endAt || input.until || null,
    pax: Number(input.pax ?? input.seats ?? 8) || 8,
    status: input.status || 'booked',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('meeting-rooms', row, 300);
  appendAudit({
    actor,
    action: 'meetingrooms.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateMeetingrooms(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.pax !== undefined) next.pax = Number(next.pax) || 0;
  list[idx] = next;
  writeCollection('meeting-rooms', list);
  appendAudit({ actor, action: 'meetingrooms.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function meetingroomsSummary() {
  const list = listMeetingrooms();
  const overrun = list.filter(isBookingOverrun);
  const boardSetups = list.filter((x) => x.boardSetup === true || x.setup === 'board');
  const released = list.filter((x) => x.status === 'released');
  const flags = openMeetingroomsFlags();
  return {
    title: 'LIKYA Meeting Rooms Ops',
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    in_use: list.filter((x) => x.status === 'in_use').length,
    done: list.filter((x) => x.status === 'done').length,
    released: released.length,
    overrun: overrun.length,
    boardSetups: boardSetups.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      booked: list.filter((x) => x.status === 'booked').length,
      in_use: list.filter((x) => x.status === 'in_use').length,
      done: list.filter((x) => x.status === 'done').length,
      released: released.length,
      overrun: overrun.length,
      board_setups: boardSetups.length,
    },
    summaryLines: [
      `Meeting rooms ${list.length} booking - in use ${list.filter((x) => x.status === 'in_use').length} - overrun ${overrun.length}`,
      `Released ${released.length} - board setups ${boardSetups.length} - flag ${flags.length}`,
    ],
    bookings: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runMeetingroomsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = meetingroomsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.overrun > 0) {
    candidates.push({
      key: 'meetingrooms_booking_overrun',
      level: overview.overrun > 0 ? 'warn' : 'info',
      text: `Meeting room booking overrun ${overview.overrun}`,
      domain: 'booking',
    });
  }
  if (force || overview.in_use > 0) {
    candidates.push({
      key: 'meetingrooms_room_release_queue',
      level: overview.in_use > 0 ? 'info' : 'info',
      text: `Meeting rooms in use ${overview.in_use}`,
      domain: 'room',
    });
  }
  if (force || overview.boardSetups > 0) {
    candidates.push({
      key: 'meetingrooms_board_setup',
      level: 'info',
      text: `Board setups ${overview.boardSetups}`,
      domain: 'setup',
    });
  }
  for (const candidate of candidates) {
    const flag = addMeetingroomsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `meetingrooms sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('mrs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('meetingrooms-sweeps', sweep, 80);
  appendAudit({ actor, action: 'meetingrooms.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: meetingroomsSummary() };
}

export function ackMeetingroomsFlag(input = {}, actor = 'system') {
  const list = readCollection('meetingrooms-flags', []) || [];
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
  writeCollection('meetingrooms-flags', list);
  appendAudit({ actor, action: 'meetingrooms.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: meetingroomsSummary() };
}

export function markMeetingroomsBookingOverrun(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'in_use' || x.status === 'booked');
  if (idx < 0) return { ok: false, error: 'Overrun yapilacak meeting room booking yok' };
  list[idx] = {
    ...list[idx],
    status: 'overrun',
    endsAt: input.endsAt || new Date(Date.now() - 10 * 60_000).toISOString(),
    overrunAt: input.overrunAt || new Date().toISOString(),
    overrunBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('meeting-rooms', list);
  appendAudit({ actor, action: 'meetingrooms.booking_overrun', detail: list[idx].room || list[idx].title, meta: { id: list[idx].id } });
  return { ok: true, meetingroom: list[idx], overview: meetingroomsSummary() };
}

export function releaseMeetingroomRoom(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'released');
  if (idx < 0) return { ok: false, error: 'Release edilecek meeting room yok' };
  list[idx] = {
    ...list[idx],
    status: 'released',
    releasedAt: input.releasedAt || new Date().toISOString(),
    releasedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('meeting-rooms', list);
  appendAudit({ actor, action: 'meetingrooms.room_release', detail: list[idx].room || list[idx].title, meta: { id: list[idx].id } });
  return { ok: true, meetingroom: list[idx], overview: meetingroomsSummary() };
}

export function seedBoardSetup(input = {}, actor = 'system') {
  const meetingroom = createMeetingrooms(
    {
      room: input.room || 'Athena Board',
      title: input.title || 'Board setup',
      organizer: input.organizer || 'CEO office',
      startsAt: input.startsAt || new Date(Date.now() + 60 * 60_000).toISOString(),
      endsAt: input.endsAt || new Date(Date.now() + 3 * 60 * 60_000).toISOString(),
      pax: Number(input.pax ?? input.seats ?? 14) || 14,
      status: input.status || 'in_use',
    },
    actor,
  );
  updateMeetingrooms(meetingroom.id, { boardSetup: true, setup: 'board', layout: input.layout || 'boardroom' }, actor);
  appendAudit({ actor, action: 'meetingrooms.seed_board_setup', detail: meetingroom.title, meta: { id: meetingroom.id } });
  return {
    ok: true,
    meetingroom: { ...meetingroom, boardSetup: true, setup: 'board', layout: input.layout || 'boardroom' },
    overview: meetingroomsSummary(),
  };
}
