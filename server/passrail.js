/**
 * AŞAMA 452 — Pass Rail.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('passrail', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'psr_1', ticket: "T-42",
      table: "12", status: 'fired', at: new Date().toISOString() }];
    writeCollection('passrail', seed);
    return seed;
  }
  return list;
}
export function listPassrail(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPassrail(input, actor = 'system') {
  const row = {
    id: `psr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ticket: input.ticket !== undefined ? input.ticket : "T-42",
    table: input.table !== undefined ? input.table : "12",
    status: input.status || 'fired',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('passrail', row, 300);
  appendAudit({
    actor,
    action: 'passrail.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePassrail(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('passrail', list);
  appendAudit({ actor, action: 'passrail.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function passrailSummary() {
  const list = listPassrail();
  return { total: list.length, fired: list.filter((x) => x.status === 'fired').length,
    plating: list.filter((x) => x.status === 'plating').length,
    run: list.filter((x) => x.status === 'run').length, passrail: list };
}
