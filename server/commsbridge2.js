/**
 * AŞAMA 832 — Comms Bridge+.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('commsbridge2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'com_1', channel: "Alpha",
      status: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('commsbridge2', seed);
    return seed;
  }
  return list;
}
export function listCommsbridge2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCommsbridge2(input, actor = 'system') {
  const row = {
    id: `com_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    channel: input.channel !== undefined ? input.channel : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('commsbridge2', row, 300);
  appendAudit({
    actor,
    action: 'commsbridge2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCommsbridge2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('commsbridge2', list);
  appendAudit({ actor, action: 'commsbridge2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function commsbridge2Summary() {
  const list = listCommsbridge2();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, commsbridge2: list };
}
