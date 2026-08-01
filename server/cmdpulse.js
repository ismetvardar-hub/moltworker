/**
 * AŞAMA 737 — Cmd Pulse.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('cmdpulse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cmd_1', signal: "Alpha",
      value: "5", status: 'ok', at: new Date().toISOString() }];
    writeCollection('cmdpulse', seed);
    return seed;
  }
  return list;
}
export function listCmdpulse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCmdpulse(input, actor = 'system') {
  const row = {
    id: `cmd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    signal: input.signal !== undefined ? input.signal : "Alpha",
    value: input.value !== undefined ? Number(input.value) || 0 : 5,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cmdpulse', row, 300);
  appendAudit({
    actor,
    action: 'cmdpulse.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCmdpulse(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cmdpulse', list);
  appendAudit({ actor, action: 'cmdpulse.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cmdpulseSummary() {
  const list = listCmdpulse();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, cmdpulse: list };
}
