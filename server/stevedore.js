/**
 * AŞAMA 434 — Stevedore.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('stevedore', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'stv_1', crew: "Team-A",
      shift: "Day", status: 'rostered', at: new Date().toISOString() }];
    writeCollection('stevedore', seed);
    return seed;
  }
  return list;
}
export function listStevedore(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createStevedore(input, actor = 'system') {
  const row = {
    id: `stv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    crew: input.crew !== undefined ? input.crew : "Team-A",
    shift: input.shift !== undefined ? input.shift : "Day",
    status: input.status || 'rostered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('stevedore', row, 300);
  appendAudit({
    actor,
    action: 'stevedore.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateStevedore(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('stevedore', list);
  appendAudit({ actor, action: 'stevedore.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function stevedoreSummary() {
  const list = listStevedore();
  return { total: list.length, rostered: list.filter((x) => x.status === 'rostered').length,
    working: list.filter((x) => x.status === 'working').length,
    done: list.filter((x) => x.status === 'done').length, stevedore: list };
}
