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
  const refunds = readCollection('culture-refunds', []) || [];
  const settlements = readCollection('culture-settlements', []) || [];
  const refundList = Array.isArray(refunds) ? refunds : [];
  const settleList = Array.isArray(settlements) ? settlements : [];
  const scans = readCollection('culture-door-scans', []) || [];
  const crew = readCollection('culture-crew-calls', []) || [];
  const scanList = Array.isArray(scans) ? scans : [];
  const crewList = Array.isArray(crew) ? crew : [];
  return {
    title: 'Kültür & Sahne',
    ethos: 'Sahne ormanın sesi — bilet, yayın, sanat tek nabız.',
    stages,
    events,
    holds: holdList.slice(0, 20),
    sales: saleList.slice(0, 20),
    streams: streamList.slice(0, 20),
    refunds: refundList.slice(0, 20),
    settlements: settleList.slice(0, 15),
    door_scans: scanList.slice(0, 20),
    crew_calls: crewList.slice(0, 15),
    summary: {
      stages_ready: stages.filter((s) => s.status === 'ready').length,
      on_sale: events.filter((e) => e.status === 'on_sale').length,
      live: events.filter((e) => e.status === 'live').length,
      tickets_held: events.reduce((s, e) => s + (Number(e.tickets_held) || 0), 0),
      tickets_sold: saleList.reduce((s, x) => s + (Number(x.qty) || 0), 0),
      streams: events.filter((e) => e.stream).length,
      streams_live: liveStreams.length,
      viewers_peak: liveStreams.reduce((s, x) => s + (Number(x.viewers_peak) || 0), 0),
      open_holds: holdList.filter((h) => h.status !== 'sold' && h.status !== 'released' && h.status !== 'expired').length,
      refunds_try: refundList.reduce((s, r) => s + (Number(r.amount_try) || 0), 0),
      settlements: settleList.length,
      door_admitted: scanList.filter((s) => s.result === 'admit').length,
      door_denied: scanList.filter((s) => s.result === 'deny').length,
      crew_open: crewList.filter((c) => c.status === 'open' || c.status === 'acked').length,
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

/** Günlük gişe rollup — satış + hold + stream peak */
export function cultureBoxOfficeRollup(actor = 'system') {
  const overview = cultureSceneOverview();
  const sales = readCollection('culture-sales', []) || [];
  const today = new Date().toISOString().slice(0, 10);
  const todaySales = (Array.isArray(sales) ? sales : []).filter((s) => String(s.at || '').startsWith(today));
  const revenue = todaySales.reduce((s, x) => s + (Number(x.price_try) || 0), 0);
  const qty = todaySales.reduce((s, x) => s + (Number(x.qty) || 0), 0);
  const rollup = {
    id: rid('cbo'),
    date: today,
    tickets_sold: qty,
    revenue_try: revenue,
    open_holds: overview.summary?.open_holds || 0,
    live_streams: overview.summary?.streams_live || 0,
    viewers_peak: overview.summary?.viewers_peak || 0,
    events_on_sale: overview.summary?.on_sale || 0,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('culture-box-office', rollup, 90);
  appendAudit({
    actor,
    action: 'culture.box_office',
    detail: `${today} · ${qty} bilet · ${revenue} TRY`,
    meta: { id: rollup.id },
  });
  return { ok: true, rollup, overview: cultureSceneOverview() };
}

/** Bayat hold temizliği — threshold dk */
export function expireCultureHolds(input = {}, actor = 'system') {
  const minutes = Number(input.minutes);
  const thresholdMs = (Number.isFinite(minutes) ? minutes : 15) * 60_000;
  const cutoff = Date.now() - thresholdMs;
  const holds = readCollection('culture-holds', []) || [];
  const list = Array.isArray(holds) ? [...holds] : [];
  const events = ensureEvents();
  const expired = [];
  for (let i = 0; i < list.length; i++) {
    const h = list[i];
    if (h.status === 'sold' || h.status === 'released' || h.status === 'expired') continue;
    if (input.event_id && h.event_id !== input.event_id) continue;
    const at = h.at ? new Date(h.at).getTime() : 0;
    if (!input.force && at > cutoff) continue;
    list[i] = { ...h, status: 'expired', expired_at: new Date().toISOString(), expired_by: actor };
    expired.push(list[i]);
    const eidx = events.findIndex((e) => e.id === h.event_id);
    if (eidx >= 0) {
      events[eidx] = {
        ...events[eidx],
        tickets_held: Math.max(0, (Number(events[eidx].tickets_held) || 0) - (Number(h.qty) || 0)),
      };
    }
  }
  if (!expired.length) return { ok: false, error: 'Bayat hold yok' };
  writeCollection('culture-holds', list);
  writeCollection('culture-events', events);
  const row = {
    id: rid('che'),
    expired: expired.length,
    qty: expired.reduce((s, h) => s + (Number(h.qty) || 0), 0),
    at: new Date().toISOString(),
    actor,
  };
  prependItem('culture-hold-expiries', row, 100);
  appendAudit({
    actor,
    action: 'culture.hold_expire',
    detail: `${row.expired} hold · ${row.qty} bilet`,
    meta: { id: row.id },
  });
  return { ok: true, expiry: row, expired, overview: cultureSceneOverview() };
}

/** Satış iadesi — partial/full */
export function refundCultureSale(input = {}, actor = 'system') {
  const sales = readCollection('culture-sales', []) || [];
  const list = Array.isArray(sales) ? [...sales] : [];
  let idx = list.findIndex((s) => s.id === input.sale_id);
  if (idx < 0) idx = list.findIndex((s) => !s.refunded_try || s.refunded_try < s.price_try);
  if (idx < 0) return { ok: false, error: 'İade edilebilir satış yok' };
  const sale = list[idx];
  const already = Number(sale.refunded_try) || 0;
  const max = Math.max(0, (Number(sale.price_try) || 0) - already);
  let amount = Number(input.amount_try);
  if (!Number.isFinite(amount) || amount <= 0) amount = max;
  amount = Math.min(amount, max);
  if (amount <= 0) return { ok: false, error: 'İade tutarı kalmadı' };
  const refunded = already + amount;
  list[idx] = {
    ...sale,
    refunded_try: refunded,
    status: refunded >= (Number(sale.price_try) || 0) ? 'refunded' : 'partial_refund',
  };
  writeCollection('culture-sales', list);
  const refund = {
    id: rid('crf'),
    sale_id: sale.id,
    event_id: sale.event_id,
    amount_try: amount,
    qty: Number(input.qty) || sale.qty,
    reason: input.reason || 'müşteri iptal',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('culture-refunds', refund, 300);
  enqueueAgentJob(
    {
      agent: 'MINT',
      title: `culture refund · ${sale.event_id} · ${amount} TRY`,
      priority: 'normal',
      payload: { refund_id: refund.id, sale_id: sale.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'culture.refund',
    detail: `${sale.event_id} · ${amount} TRY`,
    meta: { id: refund.id },
  });
  return { ok: true, refund, sale: list[idx], overview: cultureSceneOverview() };
}

/** Etkinlik closeout — gelir / sanatçı / ops payı */
export function settleCultureEvent(input = {}, actor = 'system') {
  const events = ensureEvents();
  const idx = events.findIndex((e) => e.id === input.event_id);
  const event = idx >= 0 ? events[idx] : events.find((e) => e.status === 'live' || e.status === 'ended') || events[0];
  if (!event) return { ok: false, error: 'Etkinlik yok' };
  const sales = (readCollection('culture-sales', []) || []).filter((s) => s.event_id === event.id);
  const refunds = (readCollection('culture-refunds', []) || []).filter((r) => r.event_id === event.id);
  const streams = (readCollection('culture-streams', []) || []).filter((s) => s.event_id === event.id);
  const gross = sales.reduce((s, x) => s + (Number(x.price_try) || 0), 0);
  const refunded = refunds.reduce((s, x) => s + (Number(x.amount_try) || 0), 0);
  const net = Math.max(0, gross - refunded);
  const qty = sales.reduce((s, x) => s + (Number(x.qty) || 0), 0);
  const capacity = Number(event.tickets_total) || 0;
  const utilization = capacity ? Math.round((qty / capacity) * 100) : 0;
  const peak = streams.reduce((m, s) => Math.max(m, Number(s.viewers_peak) || 0), 0);
  const artistShare = Math.round(net * (Number(input.artist_pct) || 0.55));
  const stageShare = Math.round(net * (Number(input.stage_pct) || 0.15));
  const opsShare = Math.max(0, net - artistShare - stageShare);
  const settlement = {
    id: rid('cset'),
    event_id: event.id,
    title: event.title,
    artist: event.artist,
    tickets_sold: qty,
    capacity,
    utilization_pct: utilization,
    gross_try: gross,
    refunded_try: refunded,
    net_try: net,
    viewers_peak: peak,
    lines: [
      { code: 'artist', label: 'Sanatçı payı', amount_try: artistShare },
      { code: 'stage', label: 'Sahne/venue', amount_try: stageShare },
      { code: 'ops', label: 'Ops / LİKYA', amount_try: opsShare },
    ],
    at: new Date().toISOString(),
    actor,
  };
  prependItem('culture-settlements', settlement, 200);
  const eidx = events.findIndex((e) => e.id === event.id);
  if (eidx >= 0) {
    events[eidx] = { ...events[eidx], status: 'settled', settled_at: settlement.at, settlement_id: settlement.id };
    writeCollection('culture-events', events);
  }
  enqueueAgentJob(
    {
      agent: 'CULTURE-AI',
      title: `closeout · ${event.title} · ${net} TRY`,
      priority: 'normal',
      payload: { settlement_id: settlement.id, event_id: event.id },
    },
    actor,
  );
  enqueueAgentJob(
    {
      agent: 'MINT',
      title: `culture settle pay · artist ${artistShare} / ops ${opsShare}`,
      priority: 'normal',
      payload: { settlement_id: settlement.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'culture.settle',
    detail: `${event.title} · net ${net} TRY · %${utilization}`,
    meta: { id: settlement.id },
  });
  return { ok: true, settlement, overview: cultureSceneOverview() };
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

/** Kapı QR / bilet tarama — sold satış → admit */
export function scanCultureDoor(input = {}, actor = 'system') {
  const sales = readCollection('culture-sales', []) || [];
  const saleList = Array.isArray(sales) ? sales : [];
  let sale =
    saleList.find((s) => s.id === input.sale_id || s.hold_id === input.hold_id) ||
    saleList.find((s) => s.guest === input.guest && (!input.event_id || s.event_id === input.event_id));
  if (!sale && input.force) sale = saleList.find((s) => !s.admitted_at) || saleList[0];
  const gate = input.gate || 'main';
  if (!sale) {
    const deny = {
      id: rid('cds'),
      result: 'deny',
      reason: 'bilet yok',
      gate,
      guest: input.guest || null,
      at: new Date().toISOString(),
      actor,
    };
    prependItem('culture-door-scans', deny, 400);
    enqueueAgentJob(
      {
        agent: 'NEXUS',
        title: `kapı deny · ${gate}`,
        priority: 'high',
        payload: { scan_id: deny.id },
      },
      actor,
    );
    return { ok: false, error: 'Bilet yok', scan: deny, overview: cultureSceneOverview() };
  }
  if (sale.admitted_at && !input.allow_reentry) {
    const deny = {
      id: rid('cds'),
      result: 'deny',
      reason: 'zaten giriş',
      gate,
      sale_id: sale.id,
      guest: sale.guest,
      event_id: sale.event_id,
      at: new Date().toISOString(),
      actor,
    };
    prependItem('culture-door-scans', deny, 400);
    return { ok: false, error: 'Zaten giriş', scan: deny, overview: cultureSceneOverview() };
  }
  const sidx = saleList.findIndex((s) => s.id === sale.id);
  if (sidx >= 0) {
    saleList[sidx] = { ...saleList[sidx], admitted_at: new Date().toISOString(), gate };
    writeCollection('culture-sales', saleList);
    sale = saleList[sidx];
  }
  const scan = {
    id: rid('cds'),
    result: 'admit',
    gate,
    sale_id: sale.id,
    event_id: sale.event_id,
    guest: sale.guest,
    qty: sale.qty,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('culture-door-scans', scan, 400);
  enqueueAgentJob(
    {
      agent: 'NEXUS',
      title: `kapı admit · ${sale.guest || sale.id} · ${gate}`,
      priority: 'normal',
      payload: { scan_id: scan.id, sale_id: sale.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'culture.door_scan',
    detail: `admit · ${sale.guest || sale.id} · ${gate}`,
    meta: { id: scan.id },
  });
  return { ok: true, scan, sale, overview: cultureSceneOverview() };
}

/** Etkinlik ekip çağrısı — sahne/FOH/yayın rolleri */
export function callCultureCrew(input = {}, actor = 'system') {
  const events = ensureEvents();
  const event =
    events.find((e) => e.id === input.event_id) ||
    events.find((e) => e.status === 'live' || e.status === 'on_sale') ||
    events[0];
  if (!event) return { ok: false, error: 'Etkinlik yok' };
  const roles = Array.isArray(input.roles) && input.roles.length
    ? input.roles
    : ['stage', 'foh', 'stream'];
  const call = {
    id: rid('ccc'),
    event_id: event.id,
    title: event.title,
    roles,
    note: input.note || 'show call',
    status: 'open',
    acked: [],
    at: new Date().toISOString(),
    actor,
  };
  prependItem('culture-crew-calls', call, 200);
  for (const role of roles) {
    enqueueAgentJob(
      {
        agent: role === 'stream' ? 'DAZE-VISION' : 'CULTURE-AI',
        title: `crew call · ${role} · ${event.title}`,
        priority: 'high',
        payload: { crew_call_id: call.id, role, event_id: event.id },
      },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'culture.crew_call',
    detail: `${event.title} · ${roles.join(',')}`,
    meta: { id: call.id },
  });
  return { ok: true, crew_call: call, overview: cultureSceneOverview() };
}

/** Crew call ack — rol onayı */
export function ackCultureCrewCall(input = {}, actor = 'system') {
  const list = readCollection('culture-crew-calls', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Crew call yok' };
  let idx = list.findIndex((c) => c.id === input.id && (c.status === 'open' || c.status === 'acked'));
  if (idx < 0) idx = list.findIndex((c) => c.status === 'open' || c.status === 'acked');
  if (idx < 0) return { ok: false, error: 'Açık crew call yok' };
  const role = input.role || list[idx].roles?.[0] || 'stage';
  const acked = Array.isArray(list[idx].acked) ? [...list[idx].acked] : [];
  if (!acked.includes(role)) acked.push(role);
  const done = (list[idx].roles || []).every((r) => acked.includes(r));
  list[idx] = {
    ...list[idx],
    acked,
    status: done ? 'ready' : 'acked',
    last_ack_at: new Date().toISOString(),
    last_ack_by: actor,
  };
  writeCollection('culture-crew-calls', list);
  appendAudit({
    actor,
    action: 'culture.crew_ack',
    detail: `${list[idx].title} · ${role}`,
    meta: { id: list[idx].id, role },
  });
  return { ok: true, crew_call: list[idx], overview: cultureSceneOverview() };
}
