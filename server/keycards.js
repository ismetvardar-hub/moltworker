/**
 * AŞAMA 121 — Oda Kartı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('keycards', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'key_1',
      room: "101",
      guestName: "Misafir",
      status: 'queued',
      at: new Date().toISOString(),
    }];
    writeCollection('keycards', seed);
    return seed;
  }
  return list;
}

export function listKeycards(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createKeycards(input, actor = 'system') {
  const row = {
    id: `key_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "101",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('keycards', row, 300);
  appendAudit({
    actor,
    action: 'keycards.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateKeycards(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('keycards', list);
  appendAudit({ actor, action: 'keycards.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function keycardsSummary() {
  const list = listKeycards();
  return {
    total: list.length,
    queued: list.filter((x) => x.status === 'queued').length,
    encoded: list.filter((x) => x.status === 'encoded').length,
    void: list.filter((x) => x.status === 'void').length,
    keycards: list,
  };
}
