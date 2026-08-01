/**
 * AŞAMA 863 — Calib Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('calibdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cal_1', asset: "Alpha",
      due: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('calibdesk', seed);
    return seed;
  }
  return list;
}
export function listCalibdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCalibdesk(input, actor = 'system') {
  const row = {
    id: `cal_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Alpha",
    due: input.due !== undefined ? input.due : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('calibdesk', row, 300);
  appendAudit({
    actor,
    action: 'calibdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCalibdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('calibdesk', list);
  appendAudit({ actor, action: 'calibdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function calibdeskSummary() {
  const list = listCalibdesk();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, calibdesk: list };
}
