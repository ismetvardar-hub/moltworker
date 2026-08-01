/**
 * AŞAMA 337 — Güç Bütçe.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('powerbudget', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pwb_1', node: "EG-02",
      watts: "48", status: 'ok', at: new Date().toISOString() }];
    writeCollection('powerbudget', seed);
    return seed;
  }
  return list;
}
export function listPowerbudget(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPowerbudget(input, actor = 'system') {
  const row = {
    id: `pwb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    node: input.node !== undefined ? input.node : "EG-02",
    watts: input.watts !== undefined ? Number(input.watts) || 0 : 48,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('powerbudget', row, 300);
  appendAudit({
    actor,
    action: 'powerbudget.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePowerbudget(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('powerbudget', list);
  appendAudit({ actor, action: 'powerbudget.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function powerbudgetSummary() {
  const list = listPowerbudget();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    critical: list.filter((x) => x.status === 'critical').length, powerbudget: list };
}
