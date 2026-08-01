/**
 * Kültür & Sahne — kalın domain: sahne, etkinlik, bilet hold, canlı yayın nabzı.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensureStages() {
  let list = readCollection('culture-stages', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'cs_amph', name: 'Açık Amfi', kind: 'outdoor', capacity: 420, status: 'ready' },
      { id: 'cs_forest', name: 'Orman Sahnesi', kind: 'forest', capacity: 180, status: 'ready' },
      { id: 'cs_studio', name: 'Stüdyo A', kind: 'indoor', capacity: 60, status: 'fitout' },
    ];
    writeCollection('culture-stages', list);
  }
  return list;
}

function ensureEvents() {
  let list = readCollection('culture-events', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      {
        id: 'ce_1',
        title: 'Akşam Akustik',
        stage_id: 'cs_amph',
        starts: '2026-08-02T19:30:00+03:00',
        artist: 'Likya Trio',
        tickets_total: 300,
        tickets_held: 42,
        status: 'on_sale',
        stream: false,
      },
      {
        id: 'ce_2',
        title: 'Çocuk Tiyatrosu',
        stage_id: 'cs_forest',
        starts: '2026-08-03T11:00:00+03:00',
        artist: 'Kampüs Oyuncuları',
        tickets_total: 120,
        tickets_held: 88,
        status: 'on_sale',
        stream: false,
      },
      {
        id: 'ce_3',
        title: 'Livecast Trail Talk',
        stage_id: 'cs_studio',
        starts: '2026-08-01T21:00:00+03:00',
        artist: 'DAZE Media',
        tickets_total: 0,
        tickets_held: 0,
        status: 'live',
        stream: true,
      },
    ];
    writeCollection('culture-events', list);
  }
  return list;
}

export function cultureSceneOverview() {
  const stages = ensureStages();
  const events = ensureEvents();
  const holds = readCollection('culture-holds', []) || [];
  return {
    title: 'Kültür & Sahne',
    ethos: 'Sahne ormanın sesi — bilet, yayın, sanat tek nabız.',
    stages,
    events,
    holds: (Array.isArray(holds) ? holds : []).slice(0, 20),
    summary: {
      stages_ready: stages.filter((s) => s.status === 'ready').length,
      on_sale: events.filter((e) => e.status === 'on_sale').length,
      live: events.filter((e) => e.status === 'live').length,
      tickets_held: events.reduce((s, e) => s + (Number(e.tickets_held) || 0), 0),
      streams: events.filter((e) => e.stream).length,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function createCultureEvent(input = {}, actor = 'system') {
  const stages = ensureStages();
  const stage = stages.find((s) => s.id === input.stage_id) || stages[0];
  const row = {
    id: rid('ce'),
    title: input.title || 'Yeni etkinlik',
    stage_id: stage.id,
    starts: input.starts || new Date().toISOString(),
    artist: input.artist || 'Misafir sanatçı',
    tickets_total: Number(input.tickets_total) || 100,
    tickets_held: 0,
    status: input.status || 'on_sale',
    stream: !!input.stream,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('culture-events', row, 200);
  appendAudit({ actor, action: 'culture.event', detail: `${row.title} @ ${row.stage_id}`, meta: { id: row.id } });
  return { ok: true, event: row, overview: cultureSceneOverview() };
}

export function holdCultureTicket(input = {}, actor = 'system') {
  const events = ensureEvents();
  const idx = events.findIndex((e) => e.id === input.event_id);
  if (idx < 0) return { ok: false, error: 'Etkinlik yok' };
  const ev = events[idx];
  const qty = Math.max(1, Number(input.qty) || 1);
  if (ev.tickets_total > 0 && ev.tickets_held + qty > ev.tickets_total) {
    return { ok: false, error: 'Bilet kalmadı' };
  }
  events[idx] = { ...ev, tickets_held: (Number(ev.tickets_held) || 0) + qty };
  writeCollection('culture-events', events);
  const hold = {
    id: rid('ch'),
    event_id: ev.id,
    qty,
    guest: input.guest || actor,
    at: new Date().toISOString(),
  };
  prependItem('culture-holds', hold, 300);
  appendAudit({ actor, action: 'culture.hold', detail: `${ev.title} ×${qty}`, meta: { id: hold.id } });
  return { ok: true, hold, overview: cultureSceneOverview() };
}

export function setCultureLive(input = {}, actor = 'system') {
  const events = ensureEvents();
  const idx = events.findIndex((e) => e.id === input.event_id);
  if (idx < 0) return { ok: false, error: 'Etkinlik yok' };
  events[idx] = {
    ...events[idx],
    status: input.status || 'live',
    stream: input.stream !== undefined ? !!input.stream : true,
  };
  writeCollection('culture-events', events);
  appendAudit({ actor, action: 'culture.live', detail: `${events[idx].title} → ${events[idx].status}`, meta: { id: events[idx].id } });
  return { ok: true, event: events[idx], overview: cultureSceneOverview() };
}
