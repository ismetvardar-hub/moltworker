/**
 * AŞAMA 674 — Brief Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('briefdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'brf_1', brief: "Summer cut",
      owner: "Studio", status: 'intake', at: new Date().toISOString() }];
    writeCollection('briefdesk', seed);
    return seed;
  }
  return list;
}
export function listBriefdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBriefdesk(input, actor = 'system') {
  const row = {
    id: `brf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    brief: input.brief !== undefined ? input.brief : "Summer cut",
    owner: input.owner !== undefined ? input.owner : "Studio",
    status: input.status || 'intake',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('briefdesk', row, 300);
  appendAudit({
    actor,
    action: 'briefdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBriefdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('briefdesk', list);
  appendAudit({ actor, action: 'briefdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function briefdeskSummary() {
  const list = listBriefdesk();
  return { total: list.length, intake: list.filter((x) => x.status === 'intake').length,
    in_prod: list.filter((x) => x.status === 'in_prod').length,
    delivered: list.filter((x) => x.status === 'delivered').length, briefdesk: list };
}
