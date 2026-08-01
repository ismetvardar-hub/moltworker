/**
 * AŞAMA 113 — Açık Hava Sinema.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('cinema', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'cin_1',
      film: "Gece Filmi",
      seats: "80",
      status: 'scheduled',
      at: new Date().toISOString(),
    }];
    writeCollection('cinema', seed);
    return seed;
  }
  return list;
}

export function listCinema(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createCinema(input, actor = 'system') {
  const row = {
    id: `cin_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    film: input.film !== undefined ? input.film : "Gece Filmi",
    seats: input.seats !== undefined ? Number(input.seats) || 0 : 80,
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cinema', row, 300);
  appendAudit({
    actor,
    action: 'cinema.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateCinema(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cinema', list);
  appendAudit({ actor, action: 'cinema.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function cinemaSummary() {
  const list = listCinema();
  return {
    total: list.length,
    scheduled: list.filter((x) => x.status === 'scheduled').length,
    soldout: list.filter((x) => x.status === 'soldout').length,
    done: list.filter((x) => x.status === 'done').length,
    cinema: list,
  };
}
