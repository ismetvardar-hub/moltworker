/**
 * AŞAMA 858 — Defect Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('defectlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'def_1', sku: "Alpha",
      defect: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('defectlog', seed);
    return seed;
  }
  return list;
}
export function listDefectlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDefectlog(input, actor = 'system') {
  const row = {
    id: `def_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Alpha",
    defect: input.defect !== undefined ? input.defect : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('defectlog', row, 300);
  appendAudit({
    actor,
    action: 'defectlog.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDefectlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('defectlog', list);
  appendAudit({ actor, action: 'defectlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function defectlogSummary() {
  const list = listDefectlog();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, defectlog: list };
}
