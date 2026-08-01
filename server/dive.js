/**
 * AŞAMA 111 — Dalış.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('dive', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'div_1',
      activity: "Snorkel",
      guestName: "Misafir",
      status: 'booked',
      at: new Date().toISOString(),
    }];
    writeCollection('dive', seed);
    return seed;
  }
  return list;
}

export function listDive(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createDive(input, actor = 'system') {
  const row = {
    id: `div_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    activity: input.activity !== undefined ? input.activity : "Snorkel",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dive', row, 300);
  appendAudit({
    actor,
    action: 'dive.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateDive(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dive', list);
  appendAudit({ actor, action: 'dive.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function diveSummary() {
  const list = listDive();
  return {
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    departed: list.filter((x) => x.status === 'departed').length,
    done: list.filter((x) => x.status === 'done').length,
    dive: list,
  };
}
