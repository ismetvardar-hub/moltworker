/**
 * AŞAMA 648 — Shelf Scan.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('shelfscan', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'shs_1', aisle: "2",
      findings: "3", status: 'queued', at: new Date().toISOString() }];
    writeCollection('shelfscan', seed);
    return seed;
  }
  return list;
}
export function listShelfscan(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createShelfscan(input, actor = 'system') {
  const row = {
    id: `shs_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    aisle: input.aisle !== undefined ? input.aisle : "2",
    findings: input.findings !== undefined ? Number(input.findings) || 0 : 3,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('shelfscan', row, 300);
  appendAudit({
    actor,
    action: 'shelfscan.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateShelfscan(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('shelfscan', list);
  appendAudit({ actor, action: 'shelfscan.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function shelfscanSummary() {
  const list = listShelfscan();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    scanning: list.filter((x) => x.status === 'scanning').length,
    done: list.filter((x) => x.status === 'done').length, shelfscan: list };
}
