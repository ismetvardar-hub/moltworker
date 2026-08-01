/**
 * AŞAMA 469 — Cryo Chamber.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('cryochamber', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cry_1', guestName: "Misafir",
      mins: "3", status: 'booked', at: new Date().toISOString() }];
    writeCollection('cryochamber', seed);
    return seed;
  }
  return list;
}
export function listCryochamber(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCryochamber(input, actor = 'system') {
  const row = {
    id: `cry_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    mins: input.mins !== undefined ? Number(input.mins) || 0 : 3,
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cryochamber', row, 300);
  appendAudit({
    actor,
    action: 'cryochamber.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCryochamber(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cryochamber', list);
  appendAudit({ actor, action: 'cryochamber.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cryochamberSummary() {
  const list = listCryochamber();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, cryochamber: list };
}
