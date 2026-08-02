import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

/**
 * Wave 178 - Karaoke booth ops.
 */

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('karaoke', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'kar_1',
      room: "Lounge",
      guestName: "Misafir",
      status: 'booked',
      at: new Date().toISOString(),
    }];
    writeCollection('karaoke', seed);
    return seed;
  }
  return list;
}

function openKaraokeFlags() {
  const flags = readCollection('karaoke-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addKaraokeFlag(candidate, actor = 'system') {
  const existing = readCollection('karaoke-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('karf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('karaoke-flags', list.slice(0, 200));
  return flag;
}

function isBoothOvertime(row) {
  return row.boothOvertime === true || row.status === 'overtime' || Boolean(row.overtimeAt);
}

function isEndedSession(row) {
  return row.sessionEnded === true || row.status === 'done' || Boolean(row.endedAt);
}

function isPrivateRoom(row) {
  return row.privateRoom === true || row.roomType === 'private';
}

export function listKaraoke(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createKaraoke(input = {}, actor = 'system') {
  const row = {
    id: rid('kar'),
    room: input.room !== undefined ? input.room : "Lounge",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    roomType: input.roomType !== undefined ? input.roomType : undefined,
    minutes: input.minutes !== undefined ? Number(input.minutes) || 0 : undefined,
    privateRoom: input.privateRoom === true || undefined,
    status: input.status || 'booked',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('karaoke', row, 300);
  appendAudit({
    actor,
    action: 'karaoke.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateKaraoke(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.minutes !== undefined) next.minutes = Number(next.minutes) || 0;
  list[idx] = next;
  writeCollection('karaoke', list);
  appendAudit({ actor, action: 'karaoke.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function karaokeSummary() {
  const list = listKaraoke();
  const boothOvertime = list.filter(isBoothOvertime);
  const endedSessions = list.filter(isEndedSession);
  const privateRooms = list.filter(isPrivateRoom);
  const flags = openKaraokeFlags();
  return {
    title: 'LIKYA Karaoke Ops',
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    live: list.filter((x) => x.status === 'live').length,
    done: list.filter((x) => x.status === 'done').length,
    boothOvertime: boothOvertime.length,
    endedSessions: endedSessions.length,
    privateRooms: privateRooms.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      booked: list.filter((x) => x.status === 'booked').length,
      live: list.filter((x) => x.status === 'live').length,
      done: list.filter((x) => x.status === 'done').length,
      booth_overtime: boothOvertime.length,
      ended_sessions: endedSessions.length,
      private_rooms: privateRooms.length,
    },
    summaryLines: [
      `Karaoke ${list.length} session - overtime ${boothOvertime.length} - ended ${endedSessions.length}`,
      `Booked ${list.filter((x) => x.status === 'booked').length} - private rooms ${privateRooms.length} - flag ${flags.length}`,
    ],
    karaoke: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runKaraokeSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = karaokeSummary();
  const created = [];
  const candidates = [];
  if (force || overview.boothOvertime > 0) {
    candidates.push({
      key: 'karaoke_booth_overtime',
      level: overview.boothOvertime > 0 ? 'warn' : 'info',
      text: `Karaoke booth overtime ${overview.boothOvertime}`,
      domain: 'booth',
    });
  }
  if (force || overview.endedSessions === 0) {
    candidates.push({
      key: 'karaoke_end_session_needed',
      level: overview.endedSessions === 0 ? 'warn' : 'info',
      text: `Karaoke ended sessions ${overview.endedSessions}`,
      domain: 'session',
    });
  }
  if (force || overview.privateRooms === 0) {
    candidates.push({
      key: 'karaoke_private_room_seed',
      level: 'info',
      text: `Karaoke private rooms ${overview.privateRooms}`,
      domain: 'room',
    });
  }
  for (const candidate of candidates) {
    const flag = addKaraokeFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `karaoke sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('kars'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('karaoke-sweeps', sweep, 80);
  appendAudit({ actor, action: 'karaoke.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: karaokeSummary() };
}

export function ackKaraokeFlag(input = {}, actor = 'system') {
  const list = readCollection('karaoke-flags', []) || [];
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
  writeCollection('karaoke-flags', list);
  appendAudit({ actor, action: 'karaoke.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: karaokeSummary() };
}

export function markKaraokeBoothOvertime(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isBoothOvertime(x) && !isEndedSession(x));
  if (idx < 0) return { ok: false, error: 'Overtime yapilacak karaoke booth yok' };
  list[idx] = {
    ...list[idx],
    status: 'overtime',
    boothOvertime: true,
    minutes: Number(input.minutes ?? list[idx].minutes ?? 75) || 75,
    overtimeReason: input.reason || input.overtimeReason || 'song_queue_extended',
    overtimeAt: input.overtimeAt || new Date().toISOString(),
    overtimeBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('karaoke', list);
  appendAudit({ actor, action: 'karaoke.booth_overtime', detail: list[idx].room || list[idx].guestName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, session: list[idx], overview: karaokeSummary() };
}

export function endKaraokeSession(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => isBoothOvertime(x) || x.status === 'live' || x.status === 'booked');
  if (idx < 0) return { ok: false, error: 'End edilecek karaoke session yok' };
  list[idx] = {
    ...list[idx],
    status: 'done',
    boothOvertime: false,
    sessionEnded: true,
    endedAt: input.endedAt || new Date().toISOString(),
    endedBy: actor,
    closeNote: input.note || input.closeNote || 'Session closed by ops',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('karaoke', list);
  appendAudit({ actor, action: 'karaoke.session_end', detail: list[idx].room || list[idx].guestName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, session: list[idx], overview: karaokeSummary() };
}

export function seedPrivateRoom(input = {}, actor = 'system') {
  const session = createKaraoke(
    {
      room: input.room || 'Wave 178 Private Room',
      guestName: input.guestName || 'Private karaoke guest',
      roomType: 'private',
      privateRoom: true,
      minutes: Number(input.minutes ?? 90) || 90,
      status: input.status || 'booked',
    },
    actor,
  );
  appendAudit({ actor, action: 'karaoke.seed_private_room', detail: session.room, meta: { id: session.id } });
  return { ok: true, session, overview: karaokeSummary() };
}
