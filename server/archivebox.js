/**
 * AŞAMA 872 — Archive Box.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('archivebox', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'arc_1', box: "Alpha",
      years: "5", status: 'queued', at: new Date().toISOString() }];
    writeCollection('archivebox', seed);
    return seed;
  }
  return list;
}
export function listArchivebox(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createArchivebox(input, actor = 'system') {
  const row = {
    id: `arc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    box: input.box !== undefined ? input.box : "Alpha",
    years: input.years !== undefined ? Number(input.years) || 0 : 5,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('archivebox', row, 300);
  appendAudit({
    actor,
    action: 'archivebox.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateArchivebox(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('archivebox', list);
  appendAudit({ actor, action: 'archivebox.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function archiveboxSummary() {
  const list = listArchivebox();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, archivebox: list };
}
