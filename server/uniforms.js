/**
 * AŞAMA 138 — Üniforma.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('uniforms', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'uni_1', employee: "Ayşe",
      item: "Gömlek", status: 'issued', at: new Date().toISOString() }];
    writeCollection('uniforms', seed);
    return seed;
  }
  return list;
}
export function listUniforms(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createUniforms(input, actor = 'system') {
  const row = {
    id: `uni_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Ayşe",
    item: input.item !== undefined ? input.item : "Gömlek",
    status: input.status || 'issued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('uniforms', row, 300);
  appendAudit({ actor, action: 'uniforms.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateUniforms(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('uniforms', list);
  appendAudit({ actor, action: 'uniforms.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function uniformsSummary() {
  const list = listUniforms();
  return { total: list.length, issued: list.filter((x) => x.status === 'issued').length,
    returned: list.filter((x) => x.status === 'returned').length,
    replace: list.filter((x) => x.status === 'replace').length, uniforms: list };
}
