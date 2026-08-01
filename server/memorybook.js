/**
 * AŞAMA 760 — Memory Book.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('memorybook', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mem_1', guestName: "Alpha",
      note: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('memorybook', seed);
    return seed;
  }
  return list;
}
export function listMemorybook(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMemorybook(input, actor = 'system') {
  const row = {
    id: `mem_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Alpha",
    note: input.note !== undefined ? input.note : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('memorybook', row, 300);
  appendAudit({
    actor,
    action: 'memorybook.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMemorybook(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('memorybook', list);
  appendAudit({ actor, action: 'memorybook.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function memorybookSummary() {
  const list = listMemorybook();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, memorybook: list };
}
