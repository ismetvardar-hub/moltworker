/**
 * Wave 173 - Wine cellar temperature and bin ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('wine-cellar', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'win_1',
      label: 'Lokal kirmizi',
      qty: 6,
      status: 'ok',
      bin: 'A1',
      tempC: 13,
      at: new Date().toISOString(),
    }];
    writeCollection('wine-cellar', seed);
    return seed;
  }
  return list;
}

function openWinecellarFlags() {
  const flags = readCollection('winecellar-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addWinecellarFlag(candidate, actor = 'system') {
  const existing = readCollection('winecellar-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('wcf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('winecellar-flags', list.slice(0, 200));
  return flag;
}

function isTempDrift(row) {
  const temp = Number(row.tempC ?? row.temp ?? 13);
  return row.tempDrift === true || row.status === 'drift' || temp < 10 || temp > 16;
}

export function listWinecellar(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createWinecellar(input = {}, actor = 'system') {
  const row = {
    id: rid('win'),
    label: input.label !== undefined ? input.label : 'Lokal kirmizi',
    qty: Number(input.qty ?? 6) || 0,
    status: input.status || 'ok',
    bin: input.bin !== undefined ? input.bin : 'A1',
    tempC: input.tempC !== undefined ? Number(input.tempC) || 0 : 13,
    flight: input.flight !== undefined ? input.flight : undefined,
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wine-cellar', row, 300);
  appendAudit({
    actor,
    action: 'winecellar.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateWinecellar(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.qty !== undefined) next.qty = Number(next.qty) || 0;
  if (next.tempC !== undefined) next.tempC = Number(next.tempC) || 0;
  list[idx] = next;
  writeCollection('wine-cellar', list);
  appendAudit({ actor, action: 'winecellar.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function winecellarSummary() {
  const list = listWinecellar();
  const tempDrift = list.filter(isTempDrift);
  const tastingFlights = list.filter((x) => x.tastingFlight === true || x.flightType === 'tasting');
  const flags = openWinecellarFlags();
  return {
    title: 'LIKYA Wine Cellar Ops',
    total: list.length,
    ok: list.filter((x) => x.status === 'ok').length,
    low: list.filter((x) => x.status === 'low').length,
    drift: list.filter((x) => x.status === 'drift').length,
    tempDrift: tempDrift.length,
    tastingFlights: tastingFlights.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      ok: list.filter((x) => x.status === 'ok').length,
      low: list.filter((x) => x.status === 'low').length,
      drift: list.filter((x) => x.status === 'drift').length,
      temp_drift: tempDrift.length,
      tasting_flights: tastingFlights.length,
    },
    summaryLines: [
      `Wine cellar ${list.length} label - temp drift ${tempDrift.length} - ok ${list.filter((x) => x.status === 'ok').length}`,
      `Tasting flight ${tastingFlights.length} - low ${list.filter((x) => x.status === 'low').length} - flag ${flags.length}`,
    ],
    bottles: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runWinecellarSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = winecellarSummary();
  const created = [];
  const candidates = [];
  if (force || overview.tempDrift > 0) {
    candidates.push({
      key: 'winecellar_temp_drift',
      level: overview.tempDrift > 0 ? 'warn' : 'info',
      text: `Wine cellar temp drift bins ${overview.tempDrift}`,
      domain: 'temperature',
    });
  }
  if (force || overview.low > 0) {
    candidates.push({
      key: 'winecellar_low_stock',
      level: overview.low > 0 ? 'warn' : 'info',
      text: `Wine cellar low labels ${overview.low}`,
      domain: 'stock',
    });
  }
  if (force || overview.tastingFlights > 0) {
    candidates.push({
      key: 'winecellar_tasting_flight',
      level: 'info',
      text: `Wine cellar tasting flights ${overview.tastingFlights}`,
      domain: 'tasting',
    });
  }
  for (const candidate of candidates) {
    const flag = addWinecellarFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `winecellar sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('wcs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('winecellar-sweeps', sweep, 80);
  appendAudit({ actor, action: 'winecellar.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: winecellarSummary() };
}

export function ackWinecellarFlag(input = {}, actor = 'system') {
  const list = readCollection('winecellar-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('winecellar-flags', list);
  appendAudit({ actor, action: 'winecellar.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: winecellarSummary() };
}

export function markWinecellarTempDrift(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.label && x.label === input.label));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isTempDrift(x));
  if (idx < 0) return { ok: false, error: 'Temp drift yapilacak wine bin yok' };
  list[idx] = {
    ...list[idx],
    status: 'drift',
    tempC: Number(input.tempC ?? 18) || 18,
    tempDrift: true,
    driftReason: input.reason || input.driftReason || 'cooling_variance',
    driftedAt: input.driftedAt || new Date().toISOString(),
    driftedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('wine-cellar', list);
  appendAudit({ actor, action: 'winecellar.temp_drift', detail: list[idx].label || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, bottle: list[idx], overview: winecellarSummary() };
}

export function moveWinecellarBin(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.label && x.label === input.label));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex(isTempDrift);
  if (idx < 0) return { ok: false, error: 'Move edilecek wine bin yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'ok',
    tempDrift: false,
    tempC: Number(input.tempC ?? 13) || 13,
    previousBin: list[idx].bin,
    bin: input.bin || input.toBin || 'B2',
    movedAt: input.movedAt || new Date().toISOString(),
    movedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('wine-cellar', list);
  appendAudit({ actor, action: 'winecellar.move_bin', detail: `${list[idx].label || list[idx].id} -> ${list[idx].bin}`, meta: { id: list[idx].id } });
  return { ok: true, bottle: list[idx], overview: winecellarSummary() };
}

export function seedTastingFlight(input = {}, actor = 'system') {
  const bottle = createWinecellar(
    {
      label: input.label || 'Tasting flight rose',
      qty: Number(input.qty ?? 9) || 9,
      status: input.status || 'low',
      bin: input.bin || 'T1',
      tempC: Number(input.tempC ?? 17) || 17,
      flight: input.flight || 'sunset',
    },
    actor,
  );
  const patched = updateWinecellar(
    bottle.id,
    {
      tastingFlight: true,
      flightType: 'tasting',
      tempDrift: true,
      source: 'wave173',
    },
    actor,
  );
  appendAudit({ actor, action: 'winecellar.seed_tasting_flight', detail: patched?.label || bottle.label, meta: { id: bottle.id } });
  return { ok: true, bottle: patched || bottle, overview: winecellarSummary() };
}
