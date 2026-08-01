/**
 * AŞAMA 53 — Fire / atık günlüğü.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection } from './store.js';
import { appendAudit } from './audit.js';

export function listWaste(limit = 50) {
  return readCollection('waste-log', []).slice(0, limit);
}

export function logWaste(input, actor = 'system') {
  const entry = {
    id: `wst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: String(input.item || '').trim() || 'Kalem',
    qty: Math.max(0, Number(input.qty) || 0),
    unit: input.unit || 'adet',
    reason: input.reason || 'spoilage',
    venueId: input.venueId || 'venue_kaleici',
    costTry: Math.max(0, Number(input.costTry) || 0),
    at: new Date().toISOString(),
    actor,
  };
  prependItem('waste-log', entry, 400);
  appendAudit({
    actor,
    action: 'waste.log',
    detail: `${entry.item}: ${entry.qty} ${entry.unit} (${entry.reason})`,
    meta: { id: entry.id, costTry: entry.costTry },
  });
  return entry;
}

export function wasteSummary() {
  const list = listWaste(100);
  const today = new Date().toISOString().slice(0, 10);
  const todayList = list.filter((w) => w.at?.slice(0, 10) === today);
  return {
    totalEntries: list.length,
    todayQty: todayList.reduce((s, w) => s + w.qty, 0),
    todayCost: todayList.reduce((s, w) => s + (w.costTry || 0), 0),
    entries: list.slice(0, 30),
  };
}
