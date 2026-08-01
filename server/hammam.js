/**
 * AŞAMA 97 — Hamam.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('hammam', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'hmm_1',
      guestName: "Misafir",
      slot: "10:00",
      status: 'booked',
      at: new Date().toISOString(),
    }];
    writeCollection('hammam', seed);
    return seed;
  }
  return list;
}

export function listHammam(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createHammam(input, actor = 'system') {
  const row = {
    id: `hmm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    slot: input.slot !== undefined ? input.slot : "10:00",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hammam', row, 300);
  appendAudit({
    actor,
    action: 'hammam.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateHammam(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('hammam', list);
  appendAudit({ actor, action: 'hammam.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function hammamSummary() {
  const list = listHammam();
  return {
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    in_service: list.filter((x) => x.status === 'in_service').length,
    done: list.filter((x) => x.status === 'done').length,
    hammam: list,
  };
}
