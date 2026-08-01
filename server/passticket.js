/**
 * AŞAMA 222 — Pass Ticket.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('passticket', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ptk_1', guestName: "Misafir",
      tier: "Altın", status: 'issued', at: new Date().toISOString() }];
    writeCollection('passticket', seed);
    return seed;
  }
  return list;
}
export function listPassticket(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPassticket(input, actor = 'system') {
  const row = {
    id: `ptk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    tier: input.tier !== undefined ? input.tier : "Altın",
    status: input.status || 'issued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('passticket', row, 300);
  appendAudit({ actor, action: 'passticket.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updatePassticket(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('passticket', list);
  appendAudit({ actor, action: 'passticket.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function passticketSummary() {
  const list = listPassticket();
  return { total: list.length, issued: list.filter((x) => x.status === 'issued').length,
    used: list.filter((x) => x.status === 'used').length,
    void: list.filter((x) => x.status === 'void').length, passticket: list };
}
