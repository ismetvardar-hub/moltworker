/**
 * AŞAMA 394 — Bet Board.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('betboard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bet_1', bet: "Autonomous checkout",
      size: "L", status: 'open', at: new Date().toISOString() }];
    writeCollection('betboard', seed);
    return seed;
  }
  return list;
}
export function listBetboard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBetboard(input, actor = 'system') {
  const row = {
    id: `bet_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bet: input.bet !== undefined ? input.bet : "Autonomous checkout",
    size: input.size !== undefined ? input.size : "L",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('betboard', row, 300);
  appendAudit({
    actor,
    action: 'betboard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBetboard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('betboard', list);
  appendAudit({ actor, action: 'betboard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function betboardSummary() {
  const list = listBetboard();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    winning: list.filter((x) => x.status === 'winning').length,
    killed: list.filter((x) => x.status === 'killed').length, betboard: list };
}
