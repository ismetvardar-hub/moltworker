/**
 * AŞAMA 316 — POS Bridge.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('posbridge', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pos_1', terminal: "POS-01",
      channel: "Store", status: 'online', at: new Date().toISOString() }];
    writeCollection('posbridge', seed);
    return seed;
  }
  return list;
}
export function listPosbridge(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPosbridge(input, actor = 'system') {
  const row = {
    id: `pos_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    terminal: input.terminal !== undefined ? input.terminal : "POS-01",
    channel: input.channel !== undefined ? input.channel : "Store",
    status: input.status || 'online',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('posbridge', row, 300);
  appendAudit({
    actor,
    action: 'posbridge.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePosbridge(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('posbridge', list);
  appendAudit({ actor, action: 'posbridge.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function posbridgeSummary() {
  const list = listPosbridge();
  return { total: list.length, online: list.filter((x) => x.status === 'online').length,
    degraded: list.filter((x) => x.status === 'degraded').length,
    offline: list.filter((x) => x.status === 'offline').length, posbridge: list };
}
