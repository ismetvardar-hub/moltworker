/**
 * AŞAMA 342 — Telemetry.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('telemetry', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tlm_1', metric: "cpu",
      value: "41", status: 'ok', at: new Date().toISOString() }];
    writeCollection('telemetry', seed);
    return seed;
  }
  return list;
}
export function listTelemetry(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTelemetry(input, actor = 'system') {
  const row = {
    id: `tlm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    metric: input.metric !== undefined ? input.metric : "cpu",
    value: input.value !== undefined ? Number(input.value) || 0 : 41,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('telemetry', row, 300);
  appendAudit({
    actor,
    action: 'telemetry.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTelemetry(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('telemetry', list);
  appendAudit({ actor, action: 'telemetry.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function telemetrySummary() {
  const list = listTelemetry();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    spike: list.filter((x) => x.status === 'spike').length,
    missing: list.filter((x) => x.status === 'missing').length, telemetry: list };
}
