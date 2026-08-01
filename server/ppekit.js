/**
 * AŞAMA 518 — PPE Kit.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ppekit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ppe_1', item: "Gloves",
      qty: "40", status: 'stocked', at: new Date().toISOString() }];
    writeCollection('ppekit', seed);
    return seed;
  }
  return list;
}
export function listPpekit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPpekit(input, actor = 'system') {
  const row = {
    id: `ppe_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: input.item !== undefined ? input.item : "Gloves",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 40,
    status: input.status || 'stocked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ppekit', row, 300);
  appendAudit({
    actor,
    action: 'ppekit.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePpekit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ppekit', list);
  appendAudit({ actor, action: 'ppekit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ppekitSummary() {
  const list = listPpekit();
  return { total: list.length, stocked: list.filter((x) => x.status === 'stocked').length,
    issued: list.filter((x) => x.status === 'issued').length,
    low: list.filter((x) => x.status === 'low').length, ppekit: list };
}
