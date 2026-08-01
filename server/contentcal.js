/**
 * AŞAMA 557 — Content Cal.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('contentcal', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ctc_1', slot: "Mon 10:00",
      asset: "Reel", status: 'planned', at: new Date().toISOString() }];
    writeCollection('contentcal', seed);
    return seed;
  }
  return list;
}
export function listContentcal(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createContentcal(input, actor = 'system') {
  const row = {
    id: `ctc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    slot: input.slot !== undefined ? input.slot : "Mon 10:00",
    asset: input.asset !== undefined ? input.asset : "Reel",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('contentcal', row, 300);
  appendAudit({
    actor,
    action: 'contentcal.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateContentcal(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('contentcal', list);
  appendAudit({ actor, action: 'contentcal.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function contentcalSummary() {
  const list = listContentcal();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    ready: list.filter((x) => x.status === 'ready').length,
    posted: list.filter((x) => x.status === 'posted').length, contentcal: list };
}
