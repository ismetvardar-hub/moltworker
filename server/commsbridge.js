/**
 * AŞAMA 373 — Comms Bridge.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('commsbridge', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cmb_1', channel: "Ops WhatsApp",
      message: "Standby", status: 'idle', at: new Date().toISOString() }];
    writeCollection('commsbridge', seed);
    return seed;
  }
  return list;
}
export function listCommsbridge(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCommsbridge(input, actor = 'system') {
  const row = {
    id: `cmb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    channel: input.channel !== undefined ? input.channel : "Ops WhatsApp",
    message: input.message !== undefined ? input.message : "Standby",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('commsbridge', row, 300);
  appendAudit({
    actor,
    action: 'commsbridge.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCommsbridge(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('commsbridge', list);
  appendAudit({ actor, action: 'commsbridge.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function commsbridgeSummary() {
  const list = listCommsbridge();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    broadcasting: list.filter((x) => x.status === 'broadcasting').length,
    muted: list.filter((x) => x.status === 'muted').length, commsbridge: list };
}
