/**
 * AŞAMA 746 — Alert Fuse.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('alertfuse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ale_1', fuse: "Alpha",
      level: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('alertfuse', seed);
    return seed;
  }
  return list;
}
export function listAlertfuse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAlertfuse(input, actor = 'system') {
  const row = {
    id: `ale_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    fuse: input.fuse !== undefined ? input.fuse : "Alpha",
    level: input.level !== undefined ? input.level : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('alertfuse', row, 300);
  appendAudit({
    actor,
    action: 'alertfuse.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAlertfuse(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('alertfuse', list);
  appendAudit({ actor, action: 'alertfuse.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function alertfuseSummary() {
  const list = listAlertfuse();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, alertfuse: list };
}
