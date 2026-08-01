/**
 * AŞAMA 129 — Sanat Duvarı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('artwall', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'art_1',
      piece: "Likya Rölyef",
      zone: "Lobby",
      status: 'displayed',
      at: new Date().toISOString(),
    }];
    writeCollection('artwall', seed);
    return seed;
  }
  return list;
}

export function listArtwall(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createArtwall(input, actor = 'system') {
  const row = {
    id: `art_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    piece: input.piece !== undefined ? input.piece : "Likya Rölyef",
    zone: input.zone !== undefined ? input.zone : "Lobby",
    status: input.status || 'displayed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('artwall', row, 300);
  appendAudit({
    actor,
    action: 'artwall.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateArtwall(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('artwall', list);
  appendAudit({ actor, action: 'artwall.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function artwallSummary() {
  const list = listArtwall();
  return {
    total: list.length,
    displayed: list.filter((x) => x.status === 'displayed').length,
    stored: list.filter((x) => x.status === 'stored').length,
    loaned: list.filter((x) => x.status === 'loaned').length,
    artwall: list,
  };
}
