/**
 * AŞAMA 166 — Dijital Tabela.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('signage', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sgn_1', screen: "Lobby",
      content: "Hoş geldiniz", status: 'queued', at: new Date().toISOString() }];
    writeCollection('signage', seed);
    return seed;
  }
  return list;
}
export function listSignage(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSignage(input, actor = 'system') {
  const row = {
    id: `sgn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    screen: input.screen !== undefined ? input.screen : "Lobby",
    content: input.content !== undefined ? input.content : "Hoş geldiniz",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('signage', row, 300);
  appendAudit({ actor, action: 'signage.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updateSignage(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('signage', list);
  appendAudit({ actor, action: 'signage.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function signageSummary() {
  const list = listSignage();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, signage: list };
}
