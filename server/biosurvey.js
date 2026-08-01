/**
 * AŞAMA 683 — Bio Survey.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('biosurvey', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bio2_1', habitat: "Dune",
      species: "Caretta", status: 'observed', at: new Date().toISOString() }];
    writeCollection('biosurvey', seed);
    return seed;
  }
  return list;
}
export function listBiosurvey(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBiosurvey(input, actor = 'system') {
  const row = {
    id: `bio2_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    habitat: input.habitat !== undefined ? input.habitat : "Dune",
    species: input.species !== undefined ? input.species : "Caretta",
    status: input.status || 'observed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('biosurvey', row, 300);
  appendAudit({
    actor,
    action: 'biosurvey.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBiosurvey(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('biosurvey', list);
  appendAudit({ actor, action: 'biosurvey.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function biosurveySummary() {
  const list = listBiosurvey();
  return { total: list.length, observed: list.filter((x) => x.status === 'observed').length,
    stressed: list.filter((x) => x.status === 'stressed').length,
    recovering: list.filter((x) => x.status === 'recovering').length, biosurvey: list };
}
