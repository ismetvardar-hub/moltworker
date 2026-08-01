/**
 * AŞAMA 542 — Tier Ladder.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tierladder', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tlr_1', from: "Silver",
      to: "Gold", status: 'eligible', at: new Date().toISOString() }];
    writeCollection('tierladder', seed);
    return seed;
  }
  return list;
}
export function listTierladder(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTierladder(input, actor = 'system') {
  const row = {
    id: `tlr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    from: input.from !== undefined ? input.from : "Silver",
    to: input.to !== undefined ? input.to : "Gold",
    status: input.status || 'eligible',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tierladder', row, 300);
  appendAudit({
    actor,
    action: 'tierladder.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTierladder(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tierladder', list);
  appendAudit({ actor, action: 'tierladder.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tierladderSummary() {
  const list = listTierladder();
  return { total: list.length, eligible: list.filter((x) => x.status === 'eligible').length,
    upgraded: list.filter((x) => x.status === 'upgraded').length,
    held: list.filter((x) => x.status === 'held').length, tierladder: list };
}
