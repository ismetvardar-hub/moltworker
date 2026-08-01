/**
 * AŞAMA 391 — Master Plan.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('masterplan', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mpl_1', item: "Phase-2 beach",
      owner: "CEO", status: 'planned', at: new Date().toISOString() }];
    writeCollection('masterplan', seed);
    return seed;
  }
  return list;
}
export function listMasterplan(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMasterplan(input, actor = 'system') {
  const row = {
    id: `mpl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: input.item !== undefined ? input.item : "Phase-2 beach",
    owner: input.owner !== undefined ? input.owner : "CEO",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('masterplan', row, 300);
  appendAudit({
    actor,
    action: 'masterplan.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMasterplan(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('masterplan', list);
  appendAudit({ actor, action: 'masterplan.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function masterplanSummary() {
  const list = listMasterplan();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    active: list.filter((x) => x.status === 'active').length,
    done: list.filter((x) => x.status === 'done').length, masterplan: list };
}
