/**
 * AŞAMA 110 — Fotoğraf Çekim.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('photoshoot', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'phs_1',
      guestName: "Misafir",
      slot: "17:00",
      status: 'booked',
      at: new Date().toISOString(),
    }];
    writeCollection('photoshoot', seed);
    return seed;
  }
  return list;
}

export function listPhotoshoot(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createPhotoshoot(input, actor = 'system') {
  const row = {
    id: `phs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    slot: input.slot !== undefined ? input.slot : "17:00",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('photoshoot', row, 300);
  appendAudit({
    actor,
    action: 'photoshoot.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updatePhotoshoot(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('photoshoot', list);
  appendAudit({ actor, action: 'photoshoot.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function photoshootSummary() {
  const list = listPhotoshoot();
  return {
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    done: list.filter((x) => x.status === 'done').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length,
    photoshoot: list,
  };
}
