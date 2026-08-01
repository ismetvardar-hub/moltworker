/**
 * AŞAMA 81 — Toplantı Odaları.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('meeting-rooms', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'mee_1',
      room: "Athena",
      title: "Brifing",
      status: 'booked',
      at: new Date().toISOString(),
    }];
    writeCollection('meeting-rooms', seed);
    return seed;
  }
  return list;
}

export function listMeetingrooms(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createMeetingrooms(input, actor = 'system') {
  const row = {
    id: `mee_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Athena",
    title: input.title !== undefined ? input.title : "Brifing",
    status: input.status || 'booked',
    at: new Date().toISOString(),
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

export function updateMeetingrooms(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('meeting-rooms', list);
  appendAudit({ actor, action: 'meetingrooms.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function meetingroomsSummary() {
  const list = listMeetingrooms();
  return {
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    in_use: list.filter((x) => x.status === 'in_use').length,
    done: list.filter((x) => x.status === 'done').length,
    bookings: list,
  };
}
