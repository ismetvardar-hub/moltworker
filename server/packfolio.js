/**
 * AŞAMA 644 — Pack Folio.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('packfolio', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pkf_1', guestName: "Misafir",
      total: "21200", status: 'open', at: new Date().toISOString() }];
    writeCollection('packfolio', seed);
    return seed;
  }
  return list;
}
export function listPackfolio(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPackfolio(input, actor = 'system') {
  const row = {
    id: `pkf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    total: input.total !== undefined ? Number(input.total) || 0 : 21200,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('packfolio', row, 300);
  appendAudit({
    actor,
    action: 'packfolio.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePackfolio(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('packfolio', list);
  appendAudit({ actor, action: 'packfolio.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function packfolioSummary() {
  const list = listPackfolio();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    partial: list.filter((x) => x.status === 'partial').length,
    settled: list.filter((x) => x.status === 'settled').length, packfolio: list };
}
