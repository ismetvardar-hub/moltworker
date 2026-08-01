/**
 * AŞAMA 100 — HACCP.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('haccp', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'hcp_1',
      checkpoint: "Soğuk oda",
      reading: "4C",
      status: 'pass',
      at: new Date().toISOString(),
    }];
    writeCollection('haccp', seed);
    return seed;
  }
  return list;
}

export function listHaccp(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createHaccp(input, actor = 'system') {
  const row = {
    id: `hcp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    checkpoint: input.checkpoint !== undefined ? input.checkpoint : "Soğuk oda",
    reading: input.reading !== undefined ? input.reading : "4C",
    status: input.status || 'pass',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('haccp', row, 300);
  appendAudit({
    actor,
    action: 'haccp.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateHaccp(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('haccp', list);
  appendAudit({ actor, action: 'haccp.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function haccpSummary() {
  const list = listHaccp();
  return {
    total: list.length,
    pass: list.filter((x) => x.status === 'pass').length,
    fail: list.filter((x) => x.status === 'fail').length,
    pending: list.filter((x) => x.status === 'pending').length,
    haccp: list,
  };
}
