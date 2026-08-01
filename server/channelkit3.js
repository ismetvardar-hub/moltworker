/**
 * AŞAMA 1068 — Channel Kit.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('channelkit3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cha_1', partner: "Alpha",
      kit: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('channelkit3', seed);
    return seed;
  }
  return list;
}
export function listChannelkit3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createChannelkit3(input, actor = 'system') {
  const row = {
    id: `cha_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    partner: input.partner !== undefined ? input.partner : "Alpha",
    kit: input.kit !== undefined ? input.kit : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('channelkit3', row, 300);
  appendAudit({
    actor,
    action: 'channelkit3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateChannelkit3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('channelkit3', list);
  appendAudit({ actor, action: 'channelkit3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function channelkit3Summary() {
  const list = listChannelkit3();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, channelkit3: list };
}
