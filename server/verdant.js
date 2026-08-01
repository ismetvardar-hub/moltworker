/**
 * AŞAMA 690 — LİKYA Verdant checkpoint.
 */
import { buildStudio } from './studio.js';
import { createCarbonledger, listCarbonledger, carbonledgerSummary, updateCarbonledger } from './carbonledger.js';
import { createWateruse, listWateruse, wateruseSummary, updateWateruse } from './wateruse.js';
import { createSolaryield, listSolaryield, solaryieldSummary, updateSolaryield } from './solaryield.js';
import { createEsgaudit, listEsgaudit, esgauditSummary, updateEsgaudit } from './esgaudit.js';
import { createClimategoal, listClimategoal, climategoalSummary, updateClimategoal } from './climategoal.js';
import { createEvcharger, listEvcharger, evchargerSummary, updateEvcharger } from './evcharger.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildVerdant() {
  const prev = buildStudio();
  const carbon = carbonledgerSummary();
  const water = wateruseSummary();
  const solar = solaryieldSummary();
  const esg = esgauditSummary();
  const climate = climategoalSummary();
  const ev = evchargerSummary();
  const flags = readCollection('verdant-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Verdant',
    studio: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    carbonLogged: carbon.logged || 0,
    waterAlarm: water.alarm || 0,
    solarFault: solar.fault || 0,
    esgOpen: esg.open || 0,
    climateLag: climate.lag || 0,
    evFault: ev.fault || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      water_alarm: water.alarm || 0,
      solar_fault: solar.fault || 0,
      esg_open: esg.open || 0,
      ev_fault: ev.fault || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Carbon logged ${carbon.logged || 0} · Water alarm ${water.alarm || 0}`,
      `Solar fault ${solar.fault || 0} · ESG open ${esg.open || 0}`,
      `Climate lag ${climate.lag || 0} · EV charger fault ${ev.fault || 0}`,
      `Verdant flag ${openFlags.length} açık`,
    ],
  };
}

export function runVerdantSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildVerdant();
  const existing = readCollection('verdant-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.waterAlarm || 0) > 0 || (o.solarFault || 0) > 0)) {
    candidates.push({ key: 'infra_alarm', level: 'alert', text: `Water ${o.waterAlarm || 0} · Solar ${o.solarFault || 0}`, domain: 'infra' });
  }
  if (force || ((o.esgOpen || 0) > 0)) {
    candidates.push({ key: 'esg_open', level: 'warn', text: `ESG open ${o.esgOpen || 0}`, domain: 'esg' });
  }
  if (force || ((o.evFault || 0) > 0 || (o.climateLag || 0) > 0)) {
    candidates.push({ key: 'climate_ev', level: 'warn', text: `EV fault ${o.evFault || 0} · Climate lag ${o.climateLag || 0}`, domain: 'climate' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Verdant heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('vdf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('verdant-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'GAIA-ESG',
        title: `verdant sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('vds'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('verdant-sweeps', sweep, 80);
  appendAudit({ actor, action: 'verdant.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildVerdant() };
}

export function ackVerdantFlag(input = {}, actor = 'system') {
  const list = readCollection('verdant-flags', []) || [];
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
  writeCollection('verdant-flags', list);
  appendAudit({ actor, action: 'verdant.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildVerdant() };
}

export function clearVerdantWater(input = {}, actor = 'system') {
  const rows = listWateruse().filter((x) => x.status === 'alarm' || x.status === 'high');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateWateruse(row.id, { status: 'ok', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createWateruse({ meter: 'Verdant', m3: 1, status: 'ok' }, actor);
    cleared.push(seeded.id);
  }
  for (const s of listSolaryield().filter((x) => x.status === 'fault').slice(0, 5)) { updateSolaryield(s.id, { status: 'producing', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'verdant.water_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildVerdant() };
}

export function closeVerdantEsg(input = {}, actor = 'system') {
  const rows = listEsgaudit().filter((x) => x.status === 'open' || x.status === 'remediate');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateEsgaudit(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createEsgaudit({ control: 'verdant', finding: 'close', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const c of listClimategoal().filter((x) => x.status === 'lag').slice(0, 5)) { updateClimategoal(c.id, { status: 'on_track', touched_by: actor }, actor); }
  for (const c of listCarbonledger().filter((x) => x.status === 'logged').slice(0, 5)) { updateCarbonledger(c.id, { status: 'verified', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'verdant.esg_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildVerdant() };
}

export function fixVerdantEv(input = {}, actor = 'system') {
  const rows = listEvcharger().filter((x) => x.status === 'fault');
  const fixed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateEvcharger(row.id, { status: 'free', touched_by: actor }, actor);
    if (next) fixed.push(next.id);
  }
  if (!fixed.length) {
    const seeded = createEvcharger({ unit: 'V1', kw: 22, status: 'free' }, actor);
    fixed.push(seeded.id);
  }
  enqueueAgentJob(
    {
      agent: 'GAIA-ESG',
      title: `verdant ev_fix · ${fixed.length}`,
      priority: 'high',
      payload: { ids: fixed },
    },
    actor,
  );
  appendAudit({ actor, action: 'verdant.ev_fix', detail: `${fixed.length}`, meta: { n: fixed.length } });
  return { ok: true, fixed, overview: buildVerdant() };
}
