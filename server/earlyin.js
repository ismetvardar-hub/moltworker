/**
 * AŞAMA 228 — Erken Check-in.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('earlyin', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ein_1', guestName: "Misafir",
      eta: "11:00", status: 'requested', at: new Date().toISOString() }];
    writeCollection('earlyin', seed);
    return seed;
  }
  return list;
}
export function listEarlyin(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEarlyin(input, actor = 'system') {
  const row = {
    id: `ein_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    eta: input.eta !== undefined ? input.eta : "11:00",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('earlyin', row, 300);
  appendAudit({ actor, action: 'earlyin.create', detail: String(row.title || row.guestName || row.room || row.fromRoom || row.item || row.pillow || row.scent || row.flag || row.pet || row.id), meta: { id: row.id } });
  return row;
}
export function updateEarlyin(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('earlyin', list);
  appendAudit({ actor, action: 'earlyin.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function earlyinSummary() {
  const list = listEarlyin();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    denied: list.filter((x) => x.status === 'denied').length, earlyin: list };
}
