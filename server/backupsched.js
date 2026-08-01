/**
 * AŞAMA 153 — Yedek Zamanla.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('backupsched', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bks_1', target: "data/*.json",
      cron: "0 3 * * *", status: 'enabled', at: new Date().toISOString() }];
    writeCollection('backupsched', seed);
    return seed;
  }
  return list;
}
export function listBackupsched(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBackupsched(input, actor = 'system') {
  const row = {
    id: `bks_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    target: input.target !== undefined ? input.target : "data/*.json",
    cron: input.cron !== undefined ? input.cron : "0 3 * * *",
    status: input.status || 'enabled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('backupsched', row, 300);
  appendAudit({ actor, action: 'backupsched.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateBackupsched(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('backupsched', list);
  appendAudit({ actor, action: 'backupsched.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function backupschedSummary() {
  const list = listBackupsched();
  return { total: list.length, enabled: list.filter((x) => x.status === 'enabled').length,
    paused: list.filter((x) => x.status === 'paused').length,
    failed: list.filter((x) => x.status === 'failed').length, backupsched: list };
}
