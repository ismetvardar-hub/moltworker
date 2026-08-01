/**
 * AŞAMA 128 — Karaoke.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

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

export function listKaraoke(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createKaraoke(input, actor = 'system') {
  const row = {
    id: `kar_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Lounge",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'booked',
    at: new Date().toISOString(),
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

export function updateKaraoke(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('karaoke', list);
  appendAudit({ actor, action: 'karaoke.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function karaokeSummary() {
  const list = listKaraoke();
  return {
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    live: list.filter((x) => x.status === 'live').length,
    done: list.filter((x) => x.status === 'done').length,
    karaoke: list,
  };
}
