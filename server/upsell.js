/**
 * AŞAMA 106 — Upsell.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('upsell', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'ups_1',
      offer: "Suite upgrade",
      guestName: "Misafir",
      status: 'offered',
      at: new Date().toISOString(),
    }];
    writeCollection('upsell', seed);
    return seed;
  }
  return list;
}

export function listUpsell(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createUpsell(input, actor = 'system') {
  const row = {
    id: `ups_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    offer: input.offer !== undefined ? input.offer : "Suite upgrade",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'offered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('upsell', row, 300);
  appendAudit({
    actor,
    action: 'upsell.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateUpsell(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('upsell', list);
  appendAudit({ actor, action: 'upsell.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function upsellSummary() {
  const list = listUpsell();
  return {
    total: list.length,
    offered: list.filter((x) => x.status === 'offered').length,
    accepted: list.filter((x) => x.status === 'accepted').length,
    declined: list.filter((x) => x.status === 'declined').length,
    upsell: list,
  };
}
