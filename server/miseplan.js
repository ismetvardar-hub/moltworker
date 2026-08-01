/**
 * AŞAMA 451 — Mise Plan.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('miseplan', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'msp_1', station: "Hot",
      items: "12", status: 'draft', at: new Date().toISOString() }];
    writeCollection('miseplan', seed);
    return seed;
  }
  return list;
}
export function listMiseplan(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMiseplan(input, actor = 'system') {
  const row = {
    id: `msp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    station: input.station !== undefined ? input.station : "Hot",
    items: input.items !== undefined ? Number(input.items) || 0 : 12,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('miseplan', row, 300);
  appendAudit({
    actor,
    action: 'miseplan.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMiseplan(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('miseplan', list);
  appendAudit({ actor, action: 'miseplan.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function miseplanSummary() {
  const list = listMiseplan();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    ready: list.filter((x) => x.status === 'ready').length,
    served: list.filter((x) => x.status === 'served').length, miseplan: list };
}
