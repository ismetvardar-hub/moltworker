/**
 * AŞAMA 400 — Legacy Arc.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('legacyarc', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lgc_1', theme: "Likya trails",
      year: "2030", status: 'vision', at: new Date().toISOString() }];
    writeCollection('legacyarc', seed);
    return seed;
  }
  return list;
}
export function listLegacyarc(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLegacyarc(input, actor = 'system') {
  const row = {
    id: `lgc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    theme: input.theme !== undefined ? input.theme : "Likya trails",
    year: input.year !== undefined ? input.year : "2030",
    status: input.status || 'vision',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('legacyarc', row, 300);
  appendAudit({
    actor,
    action: 'legacyarc.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLegacyarc(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('legacyarc', list);
  appendAudit({ actor, action: 'legacyarc.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function legacyarcSummary() {
  const list = listLegacyarc();
  return { total: list.length, vision: list.filter((x) => x.status === 'vision').length,
    funded: list.filter((x) => x.status === 'funded').length,
    active: list.filter((x) => x.status === 'active').length, legacyarc: list };
}
