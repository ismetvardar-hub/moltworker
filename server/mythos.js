/**
 * AŞAMA 895 — Mythos.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('mythos', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'myt_1', myth: "Alpha",
      era: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('mythos', seed);
    return seed;
  }
  return list;
}
export function listMythos(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMythos(input, actor = 'system') {
  const row = {
    id: `myt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    myth: input.myth !== undefined ? input.myth : "Alpha",
    era: input.era !== undefined ? input.era : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mythos', row, 300);
  appendAudit({
    actor,
    action: 'mythos.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMythos(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mythos', list);
  appendAudit({ actor, action: 'mythos.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function mythosSummary() {
  const list = listMythos();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, mythos: list };
}
