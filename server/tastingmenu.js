/**
 * AŞAMA 456 — Tasting Menu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tastingmenu', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tst_1', menu: "Coastal 7",
      pax: "6", status: 'booked', at: new Date().toISOString() }];
    writeCollection('tastingmenu', seed);
    return seed;
  }
  return list;
}
export function listTastingmenu(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTastingmenu(input, actor = 'system') {
  const row = {
    id: `tst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    menu: input.menu !== undefined ? input.menu : "Coastal 7",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 6,
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tastingmenu', row, 300);
  appendAudit({
    actor,
    action: 'tastingmenu.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTastingmenu(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tastingmenu', list);
  appendAudit({ actor, action: 'tastingmenu.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tastingmenuSummary() {
  const list = listTastingmenu();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    seated: list.filter((x) => x.status === 'seated').length,
    done: list.filter((x) => x.status === 'done').length, tastingmenu: list };
}
