/**
 * AŞAMA 1191 — War Room+.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('warroom23', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'war_1', incident: "Alpha",
      severity: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('warroom23', seed);
    return seed;
  }
  return list;
}
export function listWarroom23(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWarroom23(input, actor = 'system') {
  const row = {
    id: `war_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    incident: input.incident !== undefined ? input.incident : "Alpha",
    severity: input.severity !== undefined ? input.severity : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('warroom23', row, 300);
  appendAudit({
    actor,
    action: 'warroom23.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWarroom23(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('warroom23', list);
  appendAudit({ actor, action: 'warroom23.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function warroom23Summary() {
  const list = listWarroom23();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, warroom23: list };
}
