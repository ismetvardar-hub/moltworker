/**
 * AŞAMA 265 — Ödül.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('recognition', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rcg_1', employee: "Veli",
      award: "Ayın Personeli", status: 'nominated', at: new Date().toISOString() }];
    writeCollection('recognition', seed);
    return seed;
  }
  return list;
}
export function listRecognition(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRecognition(input, actor = 'system') {
  const row = {
    id: `rcg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Veli",
    award: input.award !== undefined ? input.award : "Ayın Personeli",
    status: input.status || 'nominated',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('recognition', row, 300);
  appendAudit({ actor, action: 'recognition.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateRecognition(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('recognition', list);
  appendAudit({ actor, action: 'recognition.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function recognitionSummary() {
  const list = listRecognition();
  return { total: list.length, nominated: list.filter((x) => x.status === 'nominated').length,
    awarded: list.filter((x) => x.status === 'awarded').length, recognition: list };
}
