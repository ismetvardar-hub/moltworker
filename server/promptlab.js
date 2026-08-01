/**
 * AŞAMA 529 — Prompt Lab.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('promptlab', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prl_1', prompt: "concierge_reply",
      owner: "ARTE", status: 'draft', at: new Date().toISOString() }];
    writeCollection('promptlab', seed);
    return seed;
  }
  return list;
}
export function listPromptlab(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPromptlab(input, actor = 'system') {
  const row = {
    id: `prl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    prompt: input.prompt !== undefined ? input.prompt : "concierge_reply",
    owner: input.owner !== undefined ? input.owner : "ARTE",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('promptlab', row, 300);
  appendAudit({
    actor,
    action: 'promptlab.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePromptlab(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('promptlab', list);
  appendAudit({ actor, action: 'promptlab.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function promptlabSummary() {
  const list = listPromptlab();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    eval: list.filter((x) => x.status === 'eval').length,
    prod: list.filter((x) => x.status === 'prod').length, promptlab: list };
}
