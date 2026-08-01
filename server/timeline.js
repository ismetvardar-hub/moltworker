/**
 * AŞAMA 875 — Timeline.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('timeline', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tim_1', event: "Alpha",
      year: "5", status: 'planned', at: new Date().toISOString() }];
    writeCollection('timeline', seed);
    return seed;
  }
  return list;
}
export function listTimeline(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTimeline(input, actor = 'system') {
  const row = {
    id: `tim_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    event: input.event !== undefined ? input.event : "Alpha",
    year: input.year !== undefined ? Number(input.year) || 0 : 5,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('timeline', row, 300);
  appendAudit({
    actor,
    action: 'timeline.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTimeline(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('timeline', list);
  appendAudit({ actor, action: 'timeline.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function timelineSummary() {
  const list = listTimeline();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, timeline: list };
}
