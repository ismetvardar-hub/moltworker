/**
 * Kültür & Sahne — kalın domain: sahne, etkinlik, bilet hold, canlı yayın nabzı.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

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
  const sales = readCollection('culture-sales', []) || [];
  const streams = readCollection('culture-streams', []) || [];
  const holdList = Array.isArray(holds) ? holds : [];
  const saleList = Array.isArray(sales) ? sales : [];
  const streamList = Array.isArray(streams) ? streams : [];
  const liveStreams = streamList.filter((s) => s.status === 'live');
  return {
    title: 'Kültür & Sahne',
    ethos: 'Sahne ormanın sesi — bilet, yayın, sanat tek nabız.',
    stages,
    events,
    holds: holdList.slice(0, 20),
    sales: saleList.slice(0, 20),
    streams: streamList.slice(0, 20),
    summary: {
      stages_ready: stages.filter((s) => s.status === 'ready').length,
      on_sale: events.filter((e) => e.status === 'on_sale').length,
      live: events.filter((e) => e.status === 'live').length,
      tickets_held: events.reduce((s, e) => s + (Number(e.tickets_held) || 0), 0),
      tickets_sold: saleList.reduce((s, x) => s + (Number(x.qty) || 0), 0),
      streams: events.filter((e) => e.stream).length,
      streams_live: liveStreams.length,
      viewers_peak: liveStreams.reduce((s, x) => s + (Number(x.viewers_peak) || 0), 0),
      open_holds: holdList.filter((h) => h.status !== 'sold' && h.status !== 'released').length,
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
    status: 'held',
    at: new Date().toISOString(),
  };
  prependItem('culture-holds', hold, 300);
  appendAudit({ actor, action: 'culture.hold', detail: `${ev.title} ×${qty}`, meta: { id: hold.id } });
  return { ok: true, hold, overview: cultureSceneOverview() };
}

export function confirmCultureTicket(input = {}, actor = 'system') {
  const holds = readCollection('culture-holds', []) || [];
  const list = Array.isArray(holds) ? holds : [];
  const idx = list.findIndex((h) => h.id === input.hold_id && h.status !== 'sold' && h.status !== 'released');
  if (idx < 0) {
    // en son açık hold
    const last = list.findIndex((h) => h.status === 'held' || !h.status);
    if (last < 0) return { ok: false, error: 'Hold yok' };
    return confirmCultureTicket({ hold_id: list[last].id }, actor);
  }
  const hold = list[idx];
  list[idx] = { ...hold, status: 'sold', sold_at: new Date().toISOString(), actor };
  writeCollection('culture-holds', list);
  const sale = {
    id: rid('csale'),
    hold_id: hold.id,
    event_id: hold.event_id,
    qty: hold.qty,
    guest: hold.guest,
    price_try: Number(input.price_try) || hold.qty * 250,
    at: new Date().toISOString(),
  };
  prependItem('culture-sales', sale, 300);
  appendAudit({ actor, action: 'culture.sale', detail: `${sale.event_id} ×${sale.qty}`, meta: { id: sale.id } });
  return { ok: true, sale, overview: cultureSceneOverview() };
}

export function releaseCultureHold(input = {}, actor = 'system') {
  const holds = readCollection('culture-holds', []) || [];
  const list = Array.isArray(holds) ? [...holds] : [];
  const idx = list.findIndex((h) => h.id === input.hold_id);
  if (idx < 0) return { ok: false, error: 'Hold yok' };
  const hold = list[idx];
  if (hold.status === 'sold') return { ok: false, error: 'Satılmış hold' };
  list[idx] = { ...hold, status: 'released', released_at: new Date().toISOString() };
  writeCollection('culture-holds', list);
  const events = ensureEvents();
  const eidx = events.findIndex((e) => e.id === hold.event_id);
  if (eidx >= 0) {
    events[eidx] = {
      ...events[eidx],
      tickets_held: Math.max(0, (Number(events[eidx].tickets_held) || 0) - (Number(hold.qty) || 0)),
    };
    writeCollection('culture-events', events);
  }
  appendAudit({ actor, action: 'culture.release', detail: hold.id, meta: { id: hold.id } });
  return { ok: true, hold: list[idx], overview: cultureSceneOverview() };
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

/** Canlı yayın oturumu aç — CULTURE-AI + mediawall nabız */
export function startCultureStream(input = {}, actor = 'system') {
  const events = ensureEvents();
  let ev = events.find((e) => e.id === input.event_id);
  if (!ev) ev = events.find((e) => e.stream) || events[0];
  if (!ev) return { ok: false, error: 'Etkinlik yok' };
  const eidx = events.findIndex((e) => e.id === ev.id);
  events[eidx] = { ...events[eidx], status: 'live', stream: true };
  writeCollection('culture-events', events);
  const stream = {
    id: rid('cstr'),
    event_id: ev.id,
    title: ev.title,
    channel: input.channel || 'livecast',
    status: 'live',
    viewers: Number(input.viewers) || 12,
    viewers_peak: Number(input.viewers) || 12,
    started_at: new Date().toISOString(),
    actor,
  };
  prependItem('culture-streams', stream, 200);
  enqueueAgentJob(
    {
      agent: 'CULTURE-AI',
      title: `stream live · ${ev.title} · ${stream.channel}`,
      priority: 'high',
      payload: { stream_id: stream.id, event_id: ev.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'culture.stream_start',
    detail: `${ev.title} · ${stream.channel}`,
    meta: { id: stream.id },
  });
  return { ok: true, stream, overview: cultureSceneOverview() };
}

export function pulseCultureStream(input = {}, actor = 'system') {
  const streams = readCollection('culture-streams', []) || [];
  const list = Array.isArray(streams) ? streams : [];
  let idx = list.findIndex((s) => s.id === input.stream_id && s.status === 'live');
  if (idx < 0) idx = list.findIndex((s) => s.status === 'live');
  if (idx < 0) return { ok: false, error: 'Canlı stream yok — önce start' };
  const viewers = Number(input.viewers);
  const next = Number.isFinite(viewers) ? viewers : (Number(list[idx].viewers) || 10) + 5;
  list[idx] = {
    ...list[idx],
    viewers: next,
    viewers_peak: Math.max(Number(list[idx].viewers_peak) || 0, next),
    pulsed_at: new Date().toISOString(),
  };
  writeCollection('culture-streams', list);
  appendAudit({
    actor,
    action: 'culture.stream_pulse',
    detail: `${list[idx].id} · ${next} izleyici`,
    meta: { id: list[idx].id },
  });
  return { ok: true, stream: list[idx], overview: cultureSceneOverview() };
}

export function endCultureStream(input = {}, actor = 'system') {
  const streams = readCollection('culture-streams', []) || [];
  const list = Array.isArray(streams) ? streams : [];
  let idx = list.findIndex((s) => s.id === input.stream_id && s.status === 'live');
  if (idx < 0) idx = list.findIndex((s) => s.status === 'live');
  if (idx < 0) return { ok: false, error: 'Canlı stream yok' };
  list[idx] = {
    ...list[idx],
    status: 'ended',
    ended_at: new Date().toISOString(),
    ended_by: actor,
  };
  writeCollection('culture-streams', list);
  const events = ensureEvents();
  const eidx = events.findIndex((e) => e.id === list[idx].event_id);
  if (eidx >= 0 && events[eidx].status === 'live') {
    events[eidx] = { ...events[eidx], status: 'ended', stream: false };
    writeCollection('culture-events', events);
  }
  appendAudit({
    actor,
    action: 'culture.stream_end',
    detail: `${list[idx].title} peak ${list[idx].viewers_peak}`,
    meta: { id: list[idx].id },
  });
  return { ok: true, stream: list[idx], overview: cultureSceneOverview() };
}

/** Sahne fitout → ready (veya tersi) */
export function setCultureStageStatus(input = {}, actor = 'system') {
  const stages = ensureStages();
  const idx = stages.findIndex((s) => s.id === input.stage_id || s.name === input.stage_id);
  if (idx < 0) return { ok: false, error: 'Sahne yok' };
  const status = input.status || (stages[idx].status === 'ready' ? 'fitout' : 'ready');
  stages[idx] = { ...stages[idx], status, updatedAt: new Date().toISOString() };
  writeCollection('culture-stages', stages);
  if (status === 'ready') {
    enqueueAgentJob(
      {
        agent: 'CULTURE-AI',
        title: `sahne ready · ${stages[idx].name}`,
        priority: 'normal',
        payload: { stage_id: stages[idx].id },
      },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'culture.stage',
    detail: `${stages[idx].name} → ${status}`,
    meta: { id: stages[idx].id },
  });
  return { ok: true, stage: stages[idx], overview: cultureSceneOverview() };
}
