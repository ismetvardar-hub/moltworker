/**
 * AŞAMA 628 — Move Ticket.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('moveticket', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mvt_1', from: "412",
      to: "508", status: 'requested', at: new Date().toISOString() }];
    writeCollection('moveticket', seed);
    return seed;
  }
  return list;
}
export function listMoveticket(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMoveticket(input, actor = 'system') {
  const row = {
    id: `mvt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    from: input.from !== undefined ? input.from : "412",
    to: input.to !== undefined ? input.to : "508",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('moveticket', row, 300);
  appendAudit({
    actor,
    action: 'moveticket.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMoveticket(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('moveticket', list);
  appendAudit({ actor, action: 'moveticket.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function moveticketSummary() {
  const list = listMoveticket();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    moving: list.filter((x) => x.status === 'moving').length,
    done: list.filter((x) => x.status === 'done').length, moveticket: list };
}
