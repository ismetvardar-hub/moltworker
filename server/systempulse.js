/**
 * AŞAMA 745 — System Pulse.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('systempulse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sys_1', service: "Alpha",
      latency: "5", status: 'ok', at: new Date().toISOString() }];
    writeCollection('systempulse', seed);
    return seed;
  }
  return list;
}
export function listSystempulse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSystempulse(input, actor = 'system') {
  const row = {
    id: `sys_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    service: input.service !== undefined ? input.service : "Alpha",
    latency: input.latency !== undefined ? Number(input.latency) || 0 : 5,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('systempulse', row, 300);
  appendAudit({
    actor,
    action: 'systempulse.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSystempulse(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('systempulse', list);
  appendAudit({ actor, action: 'systempulse.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function systempulseSummary() {
  const list = listSystempulse();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, systempulse: list };
}
