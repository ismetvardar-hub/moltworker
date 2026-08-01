/**
 * AŞAMA 291 — Marka Koruma.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('brandguard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bgd_1', target: "Sahte hesap",
      note: "IG", status: 'watching', at: new Date().toISOString() }];
    writeCollection('brandguard', seed);
    return seed;
  }
  return list;
}
export function listBrandguard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBrandguard(input, actor = 'system') {
  const row = {
    id: `bgd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    target: input.target !== undefined ? input.target : "Sahte hesap",
    note: input.note !== undefined ? input.note : "IG",
    status: input.status || 'watching',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('brandguard', row, 300);
  appendAudit({ actor, action: 'brandguard.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateBrandguard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('brandguard', list);
  appendAudit({ actor, action: 'brandguard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function brandguardSummary() {
  const list = listBrandguard();
  return { total: list.length, watching: list.filter((x) => x.status === 'watching').length,
    actioned: list.filter((x) => x.status === 'actioned').length,
    closed: list.filter((x) => x.status === 'closed').length, brandguard: list };
}
