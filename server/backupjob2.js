/**
 * AŞAMA 1038 — Backup Job.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('backupjob2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bac_1', system: "Alpha",
      size: "5", status: 'open', at: new Date().toISOString() }];
    writeCollection('backupjob2', seed);
    return seed;
  }
  return list;
}
export function listBackupjob2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBackupjob2(input, actor = 'system') {
  const row = {
    id: `bac_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    system: input.system !== undefined ? input.system : "Alpha",
    size: input.size !== undefined ? Number(input.size) || 0 : 5,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('backupjob2', row, 300);
  appendAudit({
    actor,
    action: 'backupjob2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBackupjob2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('backupjob2', list);
  appendAudit({ actor, action: 'backupjob2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function backupjob2Summary() {
  const list = listBackupjob2();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, backupjob2: list };
}
