/**
 * AŞAMA 617 — Folio Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('foliodesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fld2_1', room: "412",
      balance: "2400", status: 'open', at: new Date().toISOString() }];
    writeCollection('foliodesk', seed);
    return seed;
  }
  return list;
}
export function listFoliodesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFoliodesk(input, actor = 'system') {
  const row = {
    id: `fld2_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "412",
    balance: input.balance !== undefined ? Number(input.balance) || 0 : 2400,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('foliodesk', row, 300);
  appendAudit({
    actor,
    action: 'foliodesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFoliodesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('foliodesk', list);
  appendAudit({ actor, action: 'foliodesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function foliodeskSummary() {
  const list = listFoliodesk();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    disputed: list.filter((x) => x.status === 'disputed').length,
    closed: list.filter((x) => x.status === 'closed').length, foliodesk: list };
}
