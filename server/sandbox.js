/**
 * AŞAMA 804 — Sandbox.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sandbox', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'san_1', env: "Alpha",
      owner: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('sandbox', seed);
    return seed;
  }
  return list;
}
export function listSandbox(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSandbox(input, actor = 'system') {
  const row = {
    id: `san_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    env: input.env !== undefined ? input.env : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sandbox', row, 300);
  appendAudit({
    actor,
    action: 'sandbox.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSandbox(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sandbox', list);
  appendAudit({ actor, action: 'sandbox.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sandboxSummary() {
  const list = listSandbox();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, sandbox: list };
}
