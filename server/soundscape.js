/**
 * AŞAMA 438 — Soundscape.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('soundscape', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'snd_1', zone: "Beach",
      palette: "Chill", status: 'playing', at: new Date().toISOString() }];
    writeCollection('soundscape', seed);
    return seed;
  }
  return list;
}
export function listSoundscape(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSoundscape(input, actor = 'system') {
  const row = {
    id: `snd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Beach",
    palette: input.palette !== undefined ? input.palette : "Chill",
    status: input.status || 'playing',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('soundscape', row, 300);
  appendAudit({
    actor,
    action: 'soundscape.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSoundscape(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('soundscape', list);
  appendAudit({ actor, action: 'soundscape.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function soundscapeSummary() {
  const list = listSoundscape();
  return { total: list.length, playing: list.filter((x) => x.status === 'playing').length,
    paused: list.filter((x) => x.status === 'paused').length,
    muted: list.filter((x) => x.status === 'muted').length, soundscape: list };
}
