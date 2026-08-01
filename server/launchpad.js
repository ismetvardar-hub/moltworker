/**
 * AŞAMA 846 — Launch Pad.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('launchpad', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lau_1', product: "Alpha",
      date: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('launchpad', seed);
    return seed;
  }
  return list;
}
export function listLaunchpad(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLaunchpad(input, actor = 'system') {
  const row = {
    id: `lau_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    product: input.product !== undefined ? input.product : "Alpha",
    date: input.date !== undefined ? input.date : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('launchpad', row, 300);
  appendAudit({
    actor,
    action: 'launchpad.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLaunchpad(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('launchpad', list);
  appendAudit({ actor, action: 'launchpad.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function launchpadSummary() {
  const list = listLaunchpad();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, launchpad: list };
}
