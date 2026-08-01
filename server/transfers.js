/**
 * AŞAMA 79 — Transfer Masası.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('transfers', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'tra_1',
      guestName: "Misafir",
      destination: "Havalimanı",
      status: 'requested',
      at: new Date().toISOString(),
    }];
    writeCollection('transfers', seed);
    return seed;
  }
  return list;
}

export function listTransfers(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createTransfers(input, actor = 'system') {
  const row = {
    id: `tra_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    destination: input.destination !== undefined ? input.destination : "Havalimanı",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('transfers', row, 300);
  appendAudit({
    actor,
    action: 'transfers.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateTransfers(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('transfers', list);
  appendAudit({ actor, action: 'transfers.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function transfersSummary() {
  const list = listTransfers();
  return {
    total: list.length,
    requested: list.filter((x) => x.status === 'requested').length,
    assigned: list.filter((x) => x.status === 'assigned').length,
    done: list.filter((x) => x.status === 'done').length,
    rides: list,
  };
}
