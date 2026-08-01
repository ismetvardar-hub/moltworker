/**
 * AŞAMA 93 — Misafir Hesap.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('folio', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'fol_1',
      guestName: "Misafir",
      charge: "Spa",
      amount: "250",
      status: 'open',
      at: new Date().toISOString(),
    }];
    writeCollection('folio', seed);
    return seed;
  }
  return list;
}

export function listFolio(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createFolio(input, actor = 'system') {
  const row = {
    id: `fol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    charge: input.charge !== undefined ? input.charge : "Spa",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 250,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('folio', row, 300);
  appendAudit({
    actor,
    action: 'folio.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateFolio(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('folio', list);
  appendAudit({ actor, action: 'folio.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function folioSummary() {
  const list = listFolio();
  return {
    total: list.length,
    open: list.filter((x) => x.status === 'open').length,
    posted: list.filter((x) => x.status === 'posted').length,
    closed: list.filter((x) => x.status === 'closed').length,
    folio: list,
  };
}
