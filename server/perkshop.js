/**
 * AŞAMA 544 — Perk Shop.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('perkshop', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prk_1', perk: "Late checkout",
      cost: "200", status: 'listed', at: new Date().toISOString() }];
    writeCollection('perkshop', seed);
    return seed;
  }
  return list;
}
export function listPerkshop(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPerkshop(input, actor = 'system') {
  const row = {
    id: `prk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    perk: input.perk !== undefined ? input.perk : "Late checkout",
    cost: input.cost !== undefined ? Number(input.cost) || 0 : 200,
    status: input.status || 'listed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('perkshop', row, 300);
  appendAudit({
    actor,
    action: 'perkshop.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePerkshop(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('perkshop', list);
  appendAudit({ actor, action: 'perkshop.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function perkshopSummary() {
  const list = listPerkshop();
  return { total: list.length, listed: list.filter((x) => x.status === 'listed').length,
    claimed: list.filter((x) => x.status === 'claimed').length,
    retired: list.filter((x) => x.status === 'retired').length, perkshop: list };
}
