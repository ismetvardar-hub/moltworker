/**
 * AŞAMA 107 — OTA Yorumlar.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('otareviews', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'ota_1',
      channel: "Booking",
      score: "9",
      status: 'new',
      at: new Date().toISOString(),
    }];
    writeCollection('otareviews', seed);
    return seed;
  }
  return list;
}

export function listOtareviews(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createOtareviews(input, actor = 'system') {
  const row = {
    id: `ota_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    channel: input.channel !== undefined ? input.channel : "Booking",
    score: input.score !== undefined ? Number(input.score) || 0 : 9,
    status: input.status || 'new',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('otareviews', row, 300);
  appendAudit({
    actor,
    action: 'otareviews.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateOtareviews(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('otareviews', list);
  appendAudit({ actor, action: 'otareviews.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function otareviewsSummary() {
  const list = listOtareviews();
  return {
    total: list.length,
    new: list.filter((x) => x.status === 'new').length,
    replied: list.filter((x) => x.status === 'replied').length,
    escalated: list.filter((x) => x.status === 'escalated').length,
    otareviews: list,
  };
}
