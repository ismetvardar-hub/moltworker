/**
 * AŞAMA 874 — Artifact.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('artifact', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'art_1', item: "Alpha",
      era: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('artifact', seed);
    return seed;
  }
  return list;
}
export function listArtifact(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createArtifact(input, actor = 'system') {
  const row = {
    id: `art_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: input.item !== undefined ? input.item : "Alpha",
    era: input.era !== undefined ? input.era : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('artifact', row, 300);
  appendAudit({
    actor,
    action: 'artifact.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateArtifact(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('artifact', list);
  appendAudit({ actor, action: 'artifact.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function artifactSummary() {
  const list = listArtifact();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, artifact: list };
}
