/**
 * AŞAMA 708 — Channel Kit.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('channelkit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cha_1', partner: "Alpha",
      kit: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('channelkit', seed);
    return seed;
  }
  return list;
}
export function listChannelkit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createChannelkit(input, actor = 'system') {
  const row = {
    id: `cha_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    partner: input.partner !== undefined ? input.partner : "Alpha",
    kit: input.kit !== undefined ? input.kit : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('channelkit', row, 300);
  appendAudit({
    actor,
    action: 'channelkit.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateChannelkit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('channelkit', list);
  appendAudit({ actor, action: 'channelkit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function channelkitSummary() {
  const list = listChannelkit();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, channelkit: list };
}
