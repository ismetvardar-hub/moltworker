/**
 * AŞAMA 94 — Banket.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('banquet', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bnq_1',
      eventName: "Düğün",
      pax: "120",
      status: 'inquiry',
      at: new Date().toISOString(),
    }];
    writeCollection('banquet', seed);
    return seed;
  }
  return list;
}

export function listBanquet(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createBanquet(input, actor = 'system') {
  const row = {
    id: `bnq_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    eventName: input.eventName !== undefined ? input.eventName : "Düğün",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 120,
    status: input.status || 'inquiry',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('banquet', row, 300);
  appendAudit({
    actor,
    action: 'banquet.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBanquet(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('banquet', list);
  appendAudit({ actor, action: 'banquet.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function banquetSummary() {
  const list = listBanquet();
  return {
    total: list.length,
    inquiry: list.filter((x) => x.status === 'inquiry').length,
    confirmed: list.filter((x) => x.status === 'confirmed').length,
    done: list.filter((x) => x.status === 'done').length,
    banquet: list,
  };
}
