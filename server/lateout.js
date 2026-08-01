/**
 * AŞAMA 117 — Late Checkout.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('lateout', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'lco_1',
      room: "204",
      until: "14:00",
      status: 'requested',
      at: new Date().toISOString(),
    }];
    writeCollection('lateout', seed);
    return seed;
  }
  return list;
}

export function listLateout(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createLateout(input, actor = 'system') {
  const row = {
    id: `lco_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "204",
    until: input.until !== undefined ? input.until : "14:00",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lateout', row, 300);
  appendAudit({
    actor,
    action: 'lateout.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateLateout(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lateout', list);
  appendAudit({ actor, action: 'lateout.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function lateoutSummary() {
  const list = listLateout();
  return {
    total: list.length,
    requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    denied: list.filter((x) => x.status === 'denied').length,
    lateout: list,
  };
}
