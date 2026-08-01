/**
 * AŞAMA 1028 — Compliance+.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('compliance22', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'com_1', control: "Alpha",
      owner: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('compliance22', seed);
    return seed;
  }
  return list;
}
export function listCompliance22(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCompliance22(input, actor = 'system') {
  const row = {
    id: `com_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    control: input.control !== undefined ? input.control : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('compliance22', row, 300);
  appendAudit({
    actor,
    action: 'compliance22.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCompliance22(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('compliance22', list);
  appendAudit({ actor, action: 'compliance22.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function compliance22Summary() {
  const list = listCompliance22();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, compliance22: list };
}
