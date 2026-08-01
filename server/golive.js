/**
 * AŞAMA 854 — Go Live.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('golive', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gol_1', site: "Alpha",
      checklist: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('golive', seed);
    return seed;
  }
  return list;
}
export function listGolive(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGolive(input, actor = 'system') {
  const row = {
    id: `gol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    site: input.site !== undefined ? input.site : "Alpha",
    checklist: input.checklist !== undefined ? input.checklist : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('golive', row, 300);
  appendAudit({
    actor,
    action: 'golive.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGolive(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('golive', list);
  appendAudit({ actor, action: 'golive.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function goliveSummary() {
  const list = listGolive();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, golive: list };
}
