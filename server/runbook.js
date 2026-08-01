/**
 * AŞAMA 830 — Runbook.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('runbook', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'run_1', title: "Alpha",
      owner: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('runbook', seed);
    return seed;
  }
  return list;
}
export function listRunbook(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRunbook(input, actor = 'system') {
  const row = {
    id: `run_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('runbook', row, 300);
  appendAudit({
    actor,
    action: 'runbook.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRunbook(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('runbook', list);
  appendAudit({ actor, action: 'runbook.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function runbookSummary() {
  const list = listRunbook();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, runbook: list };
}
