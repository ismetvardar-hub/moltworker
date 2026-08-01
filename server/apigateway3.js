/**
 * AŞAMA 1127 — API Gateway.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('apigateway3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'api_1', route: "Alpha",
      method: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('apigateway3', seed);
    return seed;
  }
  return list;
}
export function listApigateway3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createApigateway3(input, actor = 'system') {
  const row = {
    id: `api_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    route: input.route !== undefined ? input.route : "Alpha",
    method: input.method !== undefined ? input.method : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('apigateway3', row, 300);
  appendAudit({
    actor,
    action: 'apigateway3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateApigateway3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('apigateway3', list);
  appendAudit({ actor, action: 'apigateway3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function apigateway3Summary() {
  const list = listApigateway3();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, apigateway3: list };
}
