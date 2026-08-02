/**
 * AŞAMA 59 — Sahil / dış mekan hava brifi (mock + opsiyonel).
 */
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const CONDITIONS = [
  { code: 'clear', label: 'Açık', tip: 'Sahil doluluk yüksek beklenir' },
  { code: 'partly', label: 'Parçalı bulutlu', tip: 'Normal operasyon' },
  { code: 'windy', label: 'Rüzgarlı', tip: 'Şezlong sabitleme kontrolü' },
  { code: 'rain', label: 'Yağış riski', tip: 'Kapalı alan rezervasyonlarına kaydır' },
];

const EXTREME_CODES = new Set(['windy', 'rain']);

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function readState() {
  const state = readCollection('weather-state', null);
  if (state && typeof state === 'object' && !Array.isArray(state)) return state;
  if (Array.isArray(state) && state[0] && typeof state[0] === 'object') return state[0];
  return { advisoryHold: false, tipOverride: null, extremeAckedAt: null, extremeAckedBy: null };
}

function writeState(next) {
  writeCollection('weather-state', next);
}

function baseBrief(venueId = 'venue_olympos_beach') {
  const day = new Date().toISOString().slice(0, 10);
  const idx = day.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % CONDITIONS.length;
  const c = CONDITIONS[idx];
  const tempC = 28 + (idx % 5);
  const windKph = 8 + idx * 4;
  return {
    date: day,
    venueId,
    condition: c.code,
    label: c.label,
    tip: c.tip,
    tempC,
    windKph,
    humidity: 45 + idx * 5,
    generatedAt: new Date().toISOString(),
    source: 'mock-likya',
    extreme: EXTREME_CODES.has(c.code),
  };
}

export function buildWeatherBrief(venueId = 'venue_olympos_beach') {
  const brief = baseBrief(venueId);
  const state = readState();
  const tip = state.tipOverride || brief.tip;
  const flags = readCollection('weather-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  const advisoryHold = !!state.advisoryHold;
  const extremeAcked = !!state.extremeAckedAt && brief.extreme;
  return {
    ...brief,
    tip,
    tipOverride: state.tipOverride || null,
    advisoryHold,
    extremeAcked,
    title: 'LİKYA Hava Brifi',
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      advisory_hold: advisoryHold ? 1 : 0,
      extreme: brief.extreme ? 1 : 0,
      extreme_acked: extremeAcked ? 1 : 0,
      wind_kph: brief.windKph,
      temp_c: brief.tempC,
    },
    summaryLines: [
      `${brief.label} · ${brief.tempC}°C · rüzgar ${brief.windKph} km/s`,
      tip,
      advisoryHold ? 'Advisory hold AKTİF' : 'Advisory hold yok',
      `Weather flag ${openFlags.length} açık`,
    ],
  };
}

export function refreshWeather(actor = 'system') {
  const brief = buildWeatherBrief();
  appendAudit({
    actor,
    action: 'weather.refresh',
    detail: `${brief.label} · ${brief.tempC}°C`,
    meta: { condition: brief.condition },
  });
  return brief;
}

export function runWeatherSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildWeatherBrief();
  const existing = readCollection('weather-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || o.extreme || (o.summary?.extreme || 0) > 0) {
    candidates.push({
      key: 'extreme',
      level: 'alert',
      text: `Ekstrem koşul ${o.condition} · ${o.windKph} km/s`,
      domain: 'extreme',
    });
  }
  if (force || o.advisoryHold) {
    candidates.push({
      key: 'advisory',
      level: 'warn',
      text: `Advisory hold ${o.advisoryHold ? 'aktif' : 'pasif'}`,
      domain: 'advisory',
    });
  }
  if (force || (o.windKph || 0) >= 16 || o.condition === 'rain') {
    candidates.push({
      key: 'ops',
      level: 'info',
      text: `${o.label} · tip: ${String(o.tip || '').slice(0, 80)}`,
      domain: 'ops',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Weather heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('wthf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('weather-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `weather sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('wths'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('weather-sweeps', sweep, 80);
  appendAudit({ actor, action: 'weather.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildWeatherBrief() };
}

export function ackWeatherFlag(input = {}, actor = 'system') {
  const list = readCollection('weather-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('weather-flags', list);
  appendAudit({ actor, action: 'weather.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildWeatherBrief() };
}

/** Mutator 1 — refreshWeather wrapper (ops shape). */
export function opsRefreshWeather(input = {}, actor = 'system') {
  const brief = refreshWeather(actor);
  appendAudit({ actor, action: 'weather.ops_refresh', detail: brief.label, meta: { condition: brief.condition } });
  return { ok: true, brief, refreshed: [brief.condition], overview: buildWeatherBrief() };
}

/** Mutator 2 — set / clear advisory hold. */
export function setWeatherAdvisoryHold(input = {}, actor = 'system') {
  const state = readState();
  const clear = input.clear === true || input.hold === false || input.advisoryHold === false;
  const next = {
    ...state,
    advisoryHold: clear ? false : true,
    advisoryNote: clear ? null : String(input.note || input.reason || 'advisory hold').slice(0, 240),
    advisoryAt: clear ? null : new Date().toISOString(),
    advisoryBy: clear ? null : actor,
  };
  writeState(next);
  appendAudit({
    actor,
    action: clear ? 'weather.advisory_clear' : 'weather.advisory_hold',
    detail: clear ? 'cleared' : next.advisoryNote,
    meta: { hold: next.advisoryHold },
  });
  return { ok: true, hold: next.advisoryHold, cleared: clear, overview: buildWeatherBrief() };
}

/** Mutator 3 — extreme condition ack / tip update. */
export function ackWeatherExtreme(input = {}, actor = 'system') {
  const state = readState();
  const tip = input.tip !== undefined ? String(input.tip).slice(0, 240) : state.tipOverride;
  const next = {
    ...state,
    tipOverride: tip || null,
    extremeAckedAt: new Date().toISOString(),
    extremeAckedBy: actor,
    extremeNote: String(input.note || '').slice(0, 240) || undefined,
  };
  writeState(next);
  const open = (readCollection('weather-flags', []) || []).filter((f) => f.status === 'open' && f.key === 'extreme');
  for (const f of open) {
    ackWeatherFlag({ id: f.id, note: input.note || 'extreme acked' }, actor);
  }
  appendAudit({
    actor,
    action: 'weather.extreme_ack',
    detail: tip || 'extreme acked',
    meta: { tip: !!tip },
  });
  return { ok: true, tip: next.tipOverride, acked: true, overview: buildWeatherBrief() };
}
