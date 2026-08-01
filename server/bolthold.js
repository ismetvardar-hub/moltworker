/**
 * AŞAMA 428 — Bolt Hold.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('bolthold', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'blt_1', cargo: "LYKU-100",
      reason: "Inspect", status: 'hold', at: new Date().toISOString() }];
    writeCollection('bolthold', seed);
    return seed;
  }
  return list;
}
export function listBolthold(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBolthold(input, actor = 'system') {
  const row = {
    id: `blt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    cargo: input.cargo !== undefined ? input.cargo : "LYKU-100",
    reason: input.reason !== undefined ? input.reason : "Inspect",
    status: input.status || 'hold',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bolthold', row, 300);
  appendAudit({
    actor,
    action: 'bolthold.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBolthold(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bolthold', list);
  appendAudit({ actor, action: 'bolthold.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function boltholdSummary() {
  const list = listBolthold();
  return { total: list.length, hold: list.filter((x) => x.status === 'hold').length,
    released: list.filter((x) => x.status === 'released').length, bolthold: list };
}
