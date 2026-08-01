/**
 * AŞAMA 828 — Backup Job.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('backupjob', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bac_1', system: "Alpha",
      size: "5", status: 'open', at: new Date().toISOString() }];
    writeCollection('backupjob', seed);
    return seed;
  }
  return list;
}
export function listBackupjob(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBackupjob(input, actor = 'system') {
  const row = {
    id: `bac_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    system: input.system !== undefined ? input.system : "Alpha",
    size: input.size !== undefined ? Number(input.size) || 0 : 5,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('backupjob', row, 300);
  appendAudit({
    actor,
    action: 'backupjob.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBackupjob(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('backupjob', list);
  appendAudit({ actor, action: 'backupjob.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function backupjobSummary() {
  const list = listBackupjob();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, backupjob: list };
}
