/**
 * AŞAMA 965 — Pillow Menu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pillowmenu3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pil_1', room: "Alpha",
      choice: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('pillowmenu3', seed);
    return seed;
  }
  return list;
}
export function listPillowmenu3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPillowmenu3(input, actor = 'system') {
  const row = {
    id: `pil_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "Alpha",
    choice: input.choice !== undefined ? input.choice : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pillowmenu3', row, 300);
  appendAudit({
    actor,
    action: 'pillowmenu3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePillowmenu3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pillowmenu3', list);
  appendAudit({ actor, action: 'pillowmenu3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pillowmenu3Summary() {
  const list = listPillowmenu3();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, pillowmenu3: list };
}
