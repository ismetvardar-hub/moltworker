/**
 * AŞAMA 282 — Erişim Gözden Geçir.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('accessreview', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'acr_1', user: "crew1",
      system: "Komuta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('accessreview', seed);
    return seed;
  }
  return list;
}
export function listAccessreview(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAccessreview(input, actor = 'system') {
  const row = {
    id: `acr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    user: input.user !== undefined ? input.user : "crew1",
    system: input.system !== undefined ? input.system : "Komuta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('accessreview', row, 300);
  appendAudit({ actor, action: 'accessreview.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateAccessreview(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('accessreview', list);
  appendAudit({ actor, action: 'accessreview.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function accessreviewSummary() {
  const list = listAccessreview();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    revoked: list.filter((x) => x.status === 'revoked').length, accessreview: list };
}
