/**
 * AŞAMA 606 — Key Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('keydesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'kyd_1', room: "412",
      card: "Encoded", status: 'ready', at: new Date().toISOString() }];
    writeCollection('keydesk', seed);
    return seed;
  }
  return list;
}
export function listKeydesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createKeydesk(input, actor = 'system') {
  const row = {
    id: `kyd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    card: input.card !== undefined ? input.card : "Encoded",
    status: input.status || 'ready',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('keydesk', row, 300);
  appendAudit({
    actor,
    action: 'keydesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateKeydesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('keydesk', list);
  appendAudit({ actor, action: 'keydesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function keydeskSummary() {
  const list = listKeydesk();
  return { total: list.length, ready: list.filter((x) => x.status === 'ready').length,
    issued: list.filter((x) => x.status === 'issued').length,
    void: list.filter((x) => x.status === 'void').length, keydesk: list };
}
