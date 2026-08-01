/**
 * AŞAMA 429 — Manifest.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('manifest', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mnf_1', voyage: "V-18",
      lines: "24", status: 'draft', at: new Date().toISOString() }];
    writeCollection('manifest', seed);
    return seed;
  }
  return list;
}
export function listManifest(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createManifest(input, actor = 'system') {
  const row = {
    id: `mnf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    voyage: input.voyage !== undefined ? input.voyage : "V-18",
    lines: input.lines !== undefined ? Number(input.lines) || 0 : 24,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('manifest', row, 300);
  appendAudit({
    actor,
    action: 'manifest.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateManifest(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('manifest', list);
  appendAudit({ actor, action: 'manifest.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function manifestSummary() {
  const list = listManifest();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    filed: list.filter((x) => x.status === 'filed').length,
    cleared: list.filter((x) => x.status === 'cleared').length, manifest: list };
}
