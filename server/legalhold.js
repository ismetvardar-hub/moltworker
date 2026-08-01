/**
 * AŞAMA 284 — Legal Hold.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('legalhold', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lgh_1', matter: "Dava-1",
      scope: "E-posta", status: 'active', at: new Date().toISOString() }];
    writeCollection('legalhold', seed);
    return seed;
  }
  return list;
}
export function listLegalhold(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLegalhold(input, actor = 'system') {
  const row = {
    id: `lgh_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    matter: input.matter !== undefined ? input.matter : "Dava-1",
    scope: input.scope !== undefined ? input.scope : "E-posta",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('legalhold', row, 300);
  appendAudit({ actor, action: 'legalhold.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateLegalhold(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('legalhold', list);
  appendAudit({ actor, action: 'legalhold.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function legalholdSummary() {
  const list = listLegalhold();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    released: list.filter((x) => x.status === 'released').length, legalhold: list };
}
