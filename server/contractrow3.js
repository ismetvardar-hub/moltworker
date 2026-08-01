/**
 * AŞAMA 1077 — Contract Row.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('contractrow3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'con_1', party: "Alpha",
      term: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('contractrow3', seed);
    return seed;
  }
  return list;
}
export function listContractrow3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createContractrow3(input, actor = 'system') {
  const row = {
    id: `con_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    party: input.party !== undefined ? input.party : "Alpha",
    term: input.term !== undefined ? input.term : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('contractrow3', row, 300);
  appendAudit({
    actor,
    action: 'contractrow3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateContractrow3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('contractrow3', list);
  appendAudit({ actor, action: 'contractrow3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function contractrow3Summary() {
  const list = listContractrow3();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, contractrow3: list };
}
