/**
 * AŞAMA 1040 — Runbook.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('runbook2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'run_1', title: "Alpha",
      owner: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('runbook2', seed);
    return seed;
  }
  return list;
}
export function listRunbook2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRunbook2(input, actor = 'system') {
  const row = {
    id: `run_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('runbook2', row, 300);
  appendAudit({
    actor,
    action: 'runbook2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRunbook2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('runbook2', list);
  appendAudit({ actor, action: 'runbook2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function runbook2Summary() {
  const list = listRunbook2();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, runbook2: list };
}
