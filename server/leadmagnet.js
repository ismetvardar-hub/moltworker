/**
 * AŞAMA 569 — Lead Magnet.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('leadmagnet', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ldm_1', magnet: "Guide PDF",
      leads: "240", status: 'live', at: new Date().toISOString() }];
    writeCollection('leadmagnet', seed);
    return seed;
  }
  return list;
}
export function listLeadmagnet(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLeadmagnet(input, actor = 'system') {
  const row = {
    id: `ldm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    magnet: input.magnet !== undefined ? input.magnet : "Guide PDF",
    leads: input.leads !== undefined ? Number(input.leads) || 0 : 240,
    status: input.status || 'live',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('leadmagnet', row, 300);
  appendAudit({
    actor,
    action: 'leadmagnet.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLeadmagnet(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('leadmagnet', list);
  appendAudit({ actor, action: 'leadmagnet.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function leadmagnetSummary() {
  const list = listLeadmagnet();
  return { total: list.length, live: list.filter((x) => x.status === 'live').length,
    paused: list.filter((x) => x.status === 'paused').length,
    retired: list.filter((x) => x.status === 'retired').length, leadmagnet: list };
}
