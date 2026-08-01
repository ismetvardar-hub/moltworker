/**
 * AŞAMA 313 — Latency Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('latencylog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lat_1', model: "llama3.1",
      ms: "420", status: 'ok', at: new Date().toISOString() }];
    writeCollection('latencylog', seed);
    return seed;
  }
  return list;
}
export function listLatencylog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLatencylog(input, actor = 'system') {
  const row = {
    id: `lat_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    model: input.model !== undefined ? input.model : "llama3.1",
    ms: input.ms !== undefined ? Number(input.ms) || 0 : 420,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('latencylog', row, 300);
  appendAudit({ actor, action: 'latencylog.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateLatencylog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('latencylog', list);
  appendAudit({ actor, action: 'latencylog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function latencylogSummary() {
  const list = listLatencylog();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    slow: list.filter((x) => x.status === 'slow').length,
    timeout: list.filter((x) => x.status === 'timeout').length, latencylog: list };
}
