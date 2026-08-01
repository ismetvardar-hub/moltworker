/**
 * AŞAMA 372 — Runbook Link.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('runbooklink', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rbl_1', incident: "Gate jam",
      runbook: "NEXUS unlock", status: 'linked', at: new Date().toISOString() }];
    writeCollection('runbooklink', seed);
    return seed;
  }
  return list;
}
export function listRunbooklink(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRunbooklink(input, actor = 'system') {
  const row = {
    id: `rbl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    incident: input.incident !== undefined ? input.incident : "Gate jam",
    runbook: input.runbook !== undefined ? input.runbook : "NEXUS unlock",
    status: input.status || 'linked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('runbooklink', row, 300);
  appendAudit({
    actor,
    action: 'runbooklink.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRunbooklink(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('runbooklink', list);
  appendAudit({ actor, action: 'runbooklink.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function runbooklinkSummary() {
  const list = listRunbooklink();
  return { total: list.length, linked: list.filter((x) => x.status === 'linked').length,
    stale: list.filter((x) => x.status === 'stale').length, runbooklink: list };
}
