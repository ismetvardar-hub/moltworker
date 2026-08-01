/**
 * AŞAMA 1158 — Pilot Run.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pilotrun3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pil_1', pilot: "Alpha",
      site: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('pilotrun3', seed);
    return seed;
  }
  return list;
}
export function listPilotrun3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPilotrun3(input, actor = 'system') {
  const row = {
    id: `pil_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pilot: input.pilot !== undefined ? input.pilot : "Alpha",
    site: input.site !== undefined ? input.site : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pilotrun3', row, 300);
  appendAudit({
    actor,
    action: 'pilotrun3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePilotrun3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pilotrun3', list);
  appendAudit({ actor, action: 'pilotrun3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pilotrun3Summary() {
  const list = listPilotrun3();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, pilotrun3: list };
}
