/**
 * AŞAMA 643 — MINT Bundle.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('mintbundle', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mnb_1', bundle: "Stay+Tour",
      price: "18500", status: 'draft', at: new Date().toISOString() }];
    writeCollection('mintbundle', seed);
    return seed;
  }
  return list;
}
export function listMintbundle(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMintbundle(input, actor = 'system') {
  const row = {
    id: `mnb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bundle: input.bundle !== undefined ? input.bundle : "Stay+Tour",
    price: input.price !== undefined ? Number(input.price) || 0 : 18500,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mintbundle', row, 300);
  appendAudit({
    actor,
    action: 'mintbundle.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMintbundle(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mintbundle', list);
  appendAudit({ actor, action: 'mintbundle.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function mintbundleSummary() {
  const list = listMintbundle();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    priced: list.filter((x) => x.status === 'priced').length,
    live: list.filter((x) => x.status === 'live').length,
    expired: list.filter((x) => x.status === 'expired').length, mintbundle: list };
}
