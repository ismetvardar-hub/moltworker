/**
 * AŞAMA 116 — Kahvaltı Slot.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('breakfast', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'brk_1',
      slot: "08:00",
      guestName: "Misafir",
      status: 'booked',
      at: new Date().toISOString(),
    }];
    writeCollection('breakfast', seed);
    return seed;
  }
  return list;
}

export function listBreakfast(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createBreakfast(input, actor = 'system') {
  const row = {
    id: `brk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    slot: input.slot !== undefined ? input.slot : "08:00",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('breakfast', row, 300);
  appendAudit({
    actor,
    action: 'breakfast.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBreakfast(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('breakfast', list);
  appendAudit({ actor, action: 'breakfast.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function breakfastSummary() {
  const list = listBreakfast();
  return {
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    seated: list.filter((x) => x.status === 'seated').length,
    done: list.filter((x) => x.status === 'done').length,
    breakfast: list,
  };
}
