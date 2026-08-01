/**
 * AŞAMA 324 — Last Mile.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('lastmile', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lsm_1', stop: "Oda 204",
      etaMin: "12", status: 'queued', at: new Date().toISOString() }];
    writeCollection('lastmile', seed);
    return seed;
  }
  return list;
}
export function listLastmile(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLastmile(input, actor = 'system') {
  const row = {
    id: `lsm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    stop: input.stop !== undefined ? input.stop : "Oda 204",
    etaMin: input.etaMin !== undefined ? Number(input.etaMin) || 0 : 12,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lastmile', row, 300);
  appendAudit({
    actor,
    action: 'lastmile.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLastmile(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lastmile', list);
  appendAudit({ actor, action: 'lastmile.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function lastmileSummary() {
  const list = listLastmile();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    enroute: list.filter((x) => x.status === 'enroute').length,
    done: list.filter((x) => x.status === 'done').length, lastmile: list };
}
