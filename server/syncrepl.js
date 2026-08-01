/**
 * AŞAMA 340 — Sync Replica.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('syncrepl', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'syr_1', replica: "R-1",
      lagSec: "2", status: 'synced', at: new Date().toISOString() }];
    writeCollection('syncrepl', seed);
    return seed;
  }
  return list;
}
export function listSyncrepl(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSyncrepl(input, actor = 'system') {
  const row = {
    id: `syr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    replica: input.replica !== undefined ? input.replica : "R-1",
    lagSec: input.lagSec !== undefined ? Number(input.lagSec) || 0 : 2,
    status: input.status || 'synced',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('syncrepl', row, 300);
  appendAudit({
    actor,
    action: 'syncrepl.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSyncrepl(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('syncrepl', list);
  appendAudit({ actor, action: 'syncrepl.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function syncreplSummary() {
  const list = listSyncrepl();
  return { total: list.length, synced: list.filter((x) => x.status === 'synced').length,
    lagging: list.filter((x) => x.status === 'lagging').length,
    broken: list.filter((x) => x.status === 'broken').length, syncrepl: list };
}
