/**
 * AŞAMA 407 — Kumsal Ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('duneops', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dun_1', zone: "Dune-A",
      task: "Rake", status: 'planned', at: new Date().toISOString() }];
    writeCollection('duneops', seed);
    return seed;
  }
  return list;
}
export function listDuneops(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDuneops(input, actor = 'system') {
  const row = {
    id: `dun_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Dune-A",
    task: input.task !== undefined ? input.task : "Rake",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('duneops', row, 300);
  appendAudit({
    actor,
    action: 'duneops.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDuneops(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('duneops', list);
  appendAudit({ actor, action: 'duneops.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function duneopsSummary() {
  const list = listDuneops();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, duneops: list };
}
