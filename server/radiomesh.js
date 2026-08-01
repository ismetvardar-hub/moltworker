/**
 * AŞAMA 333 — Radio Mesh.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('radiomesh', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rdm_1', channel: "Ch-7",
      noise: "12", status: 'clear', at: new Date().toISOString() }];
    writeCollection('radiomesh', seed);
    return seed;
  }
  return list;
}
export function listRadiomesh(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRadiomesh(input, actor = 'system') {
  const row = {
    id: `rdm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    channel: input.channel !== undefined ? input.channel : "Ch-7",
    noise: input.noise !== undefined ? Number(input.noise) || 0 : 12,
    status: input.status || 'clear',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('radiomesh', row, 300);
  appendAudit({
    actor,
    action: 'radiomesh.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRadiomesh(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('radiomesh', list);
  appendAudit({ actor, action: 'radiomesh.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function radiomeshSummary() {
  const list = listRadiomesh();
  return { total: list.length, clear: list.filter((x) => x.status === 'clear').length,
    noisy: list.filter((x) => x.status === 'noisy').length,
    jam: list.filter((x) => x.status === 'jam').length, radiomesh: list };
}
