/**
 * AŞAMA 91 — Concierge.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('concierge', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'cnc_1',
      request: "Transfer talebi",
      guestName: "Misafir",
      status: 'open',
      at: new Date().toISOString(),
    }];
    writeCollection('concierge', seed);
    return seed;
  }
  return list;
}

export function listConcierge(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createConcierge(input, actor = 'system') {
  const row = {
    id: `cnc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    request: input.request !== undefined ? input.request : "Transfer talebi",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('concierge', row, 300);
  appendAudit({
    actor,
    action: 'concierge.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateConcierge(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('concierge', list);
  appendAudit({ actor, action: 'concierge.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function conciergeSummary() {
  const list = listConcierge();
  return {
    total: list.length,
    open: list.filter((x) => x.status === 'open').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length,
    concierge: list,
  };
}
