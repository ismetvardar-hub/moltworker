/**
 * AŞAMA 114 — Butik.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('retail', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'rtl_1',
      sku: "Şapka",
      qty: "2",
      status: 'sold',
      at: new Date().toISOString(),
    }];
    writeCollection('retail', seed);
    return seed;
  }
  return list;
}

export function listRetail(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createRetail(input, actor = 'system') {
  const row = {
    id: `rtl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Şapka",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 2,
    status: input.status || 'sold',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('retail', row, 300);
  appendAudit({
    actor,
    action: 'retail.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateRetail(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('retail', list);
  appendAudit({ actor, action: 'retail.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function retailSummary() {
  const list = listRetail();
  return {
    total: list.length,
    sold: list.filter((x) => x.status === 'sold').length,
    refund: list.filter((x) => x.status === 'refund').length,
    hold: list.filter((x) => x.status === 'hold').length,
    retail: list,
  };
}
