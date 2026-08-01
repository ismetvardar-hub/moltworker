/**
 * AŞAMA 537 — A/B Test.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('abtest', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'abt_1', experiment: "upsell_copy",
      variant: "B", status: 'running', at: new Date().toISOString() }];
    writeCollection('abtest', seed);
    return seed;
  }
  return list;
}
export function listAbtest(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAbtest(input, actor = 'system') {
  const row = {
    id: `abt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    experiment: input.experiment !== undefined ? input.experiment : "upsell_copy",
    variant: input.variant !== undefined ? input.variant : "B",
    status: input.status || 'running',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('abtest', row, 300);
  appendAudit({
    actor,
    action: 'abtest.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAbtest(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('abtest', list);
  appendAudit({ actor, action: 'abtest.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function abtestSummary() {
  const list = listAbtest();
  return { total: list.length, running: list.filter((x) => x.status === 'running').length,
    winner: list.filter((x) => x.status === 'winner').length,
    stopped: list.filter((x) => x.status === 'stopped').length, abtest: list };
}
