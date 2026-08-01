/**
 * AŞAMA 203 — Telsiz Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('radiolog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rad_1', channel: "Ops",
      message: "Check", status: 'logged', at: new Date().toISOString() }];
    writeCollection('radiolog', seed);
    return seed;
  }
  return list;
}
export function listRadiolog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRadiolog(input, actor = 'system') {
  const row = {
    id: `rad_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    channel: input.channel !== undefined ? input.channel : "Ops",
    message: input.message !== undefined ? input.message : "Check",
    status: input.status || 'logged',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('radiolog', row, 300);
  appendAudit({ actor, action: 'radiolog.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateRadiolog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('radiolog', list);
  appendAudit({ actor, action: 'radiolog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function radiologSummary() {
  const list = listRadiolog();
  return { total: list.length, logged: list.filter((x) => x.status === 'logged').length,
    ack: list.filter((x) => x.status === 'ack').length,
    escalated: list.filter((x) => x.status === 'escalated').length, radiolog: list };
}
