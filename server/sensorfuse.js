/**
 * AŞAMA 334 — Sensor Fuse.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sensorfuse', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'snf_1', sensor: "PIR-12",
      event: "motion", status: 'ok', at: new Date().toISOString() }];
    writeCollection('sensorfuse', seed);
    return seed;
  }
  return list;
}
export function listSensorfuse(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSensorfuse(input, actor = 'system') {
  const row = {
    id: `snf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sensor: input.sensor !== undefined ? input.sensor : "PIR-12",
    event: input.event !== undefined ? input.event : "motion",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sensorfuse', row, 300);
  appendAudit({
    actor,
    action: 'sensorfuse.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSensorfuse(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sensorfuse', list);
  appendAudit({ actor, action: 'sensorfuse.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sensorfuseSummary() {
  const list = listSensorfuse();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    anomaly: list.filter((x) => x.status === 'anomaly').length,
    offline: list.filter((x) => x.status === 'offline').length, sensorfuse: list };
}
