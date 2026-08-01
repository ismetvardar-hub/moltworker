/**
 * AŞAMA 1109 — Seal Note.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sealnote3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sea_1', seal: "Alpha",
      version: "5", status: 'green', at: new Date().toISOString() }];
    writeCollection('sealnote3', seed);
    return seed;
  }
  return list;
}
export function listSealnote3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSealnote3(input, actor = 'system') {
  const row = {
    id: `sea_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    seal: input.seal !== undefined ? input.seal : "Alpha",
    version: input.version !== undefined ? Number(input.version) || 0 : 5,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sealnote3', row, 300);
  appendAudit({
    actor,
    action: 'sealnote3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSealnote3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sealnote3', list);
  appendAudit({ actor, action: 'sealnote3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sealnote3Summary() {
  const list = listSealnote3();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, sealnote3: list };
}
