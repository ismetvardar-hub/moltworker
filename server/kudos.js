/**
 * AŞAMA 57 — Personel takdir / kudos.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection } from './store.js';
import { appendAudit } from './audit.js';

export function listKudos(limit = 40) {
  return readCollection('kudos', []).slice(0, limit);
}

export function createKudos(input, actor = 'system') {
  const entry = {
    id: `kd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    toPerson: String(input.toPerson || '').trim() || 'Ekip',
    fromPerson: input.fromPerson || actor,
    message: String(input.message || '').trim() || 'Teşekkürler',
    tag: input.tag || 'centilmenlik',
    at: new Date().toISOString(),
  };
  prependItem('kudos', entry, 300);
  appendAudit({
    actor,
    action: 'kudos.create',
    detail: `${entry.fromPerson} → ${entry.toPerson}: ${entry.tag}`,
    meta: { id: entry.id },
  });
  return entry;
}

export function kudosSummary() {
  const list = listKudos(100);
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: list.length,
    today: list.filter((k) => k.at?.slice(0, 10) === today).length,
    entries: list.slice(0, 30),
  };
}
