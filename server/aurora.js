/**
 * AŞAMA 450 — Aurora checkpoint.
 */
import { buildHarbor } from './harbor.js';
import { createAuroradeck, listAuroradeck, auroradeckSummary, updateAuroradeck } from './auroradeck.js';
import { createLightshow, listLightshow, lightshowSummary, updateLightshow } from './lightshow.js';
import { createGuestflow, listGuestflow, guestflowSummary, updateGuestflow } from './guestflow.js';
import { createImmersive, listImmersive, immersiveSummary, updateImmersive } from './immersive.js';
import { createNightmode, listNightmode, nightmodeSummary, updateNightmode } from './nightmode.js';
import { createProjection, listProjection, projectionSummary, updateProjection } from './projection.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildAurora() {
  const prev = buildHarbor();
  const deck = auroradeckSummary();
  const light = lightshowSummary();
  const flow = guestflowSummary();
  const imm = immersiveSummary();
  const night = nightmodeSummary();
  const proj = projectionSummary();
  const flags = readCollection('aurora-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Aurora',
    harbor: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    deckLive: deck.live || 0,
    lightRunning: light.running || 0,
    flowJam: flow.jam || 0,
    immersiveRun: imm.running || 0,
    nightActive: night.active || 0,
    projecting: proj.projecting || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      flow_jam: flow.jam || 0,
      light_running: light.running || 0,
      deck_live: deck.live || 0,
      night_active: night.active || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Aurora deck live ${deck.live || 0} · Light show running ${light.running || 0}`,
      `Guest flow jam ${flow.jam || 0} · Immersive running ${imm.running || 0}`,
      `Night mode active ${night.active || 0} · Projection live ${proj.projecting || 0}`,
      `Aurora flag ${openFlags.length} açık`,
    ],
  };
}

export function runAuroraSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildAurora();
  const existing = readCollection('aurora-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.flowJam || 0) > 0)) {
    candidates.push({ key: 'flow_jam', level: 'alert', text: `Guest flow jam ${o.flowJam || 0}`, domain: 'flow' });
  }
  if (force || ((o.lightRunning || 0) > 0)) {
    candidates.push({ key: 'light_run', level: 'info', text: `Light show ${o.lightRunning || 0}`, domain: 'light' });
  }
  if (force || ((o.deckLive || 0) > 0 || (o.nightActive || 0) > 0)) {
    candidates.push({ key: 'show_mode', level: 'warn', text: `Deck live ${o.deckLive || 0} · Night ${o.nightActive || 0}`, domain: 'show' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Aurora heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('auf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('aurora-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ARTE', title: `aurora sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('aus'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('aurora-sweeps', sweep, 80);
  appendAudit({ actor, action: 'aurora.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildAurora() };
}

export function ackAuroraFlag(input = {}, actor = 'system') {
  const list = readCollection('aurora-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('aurora-flags', list);
  appendAudit({ actor, action: 'aurora.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildAurora() };
}

export function clearAuroraFlow(input = {}, actor = 'system') {
  const rows = listGuestflow().filter((x) => x.status === 'jam' || x.status === 'dense');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateGuestflow(row.id, { status: 'smooth', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createGuestflow({ zone: 'Aurora', density: 'low', status: 'smooth' }, actor);
    cleared.push(seeded.id);
  }
  appendAudit({ actor, action: 'aurora.flow_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildAurora() };
}

export function endAuroraLight(input = {}, actor = 'system') {
  const rows = listLightshow().filter((x) => x.status === 'running' || x.status === 'programmed');
  const ended = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateLightshow(row.id, { status: 'done', touched_by: actor }, actor);
    if (next) ended.push(next.id);
  }
  if (!ended.length) {
    const seeded = createLightshow({ cue: 'A1', rig: 'main', status: 'done' }, actor);
    ended.push(seeded.id);
  }
  for (const d of listAuroradeck().filter((x) => x.status === 'live' || x.status === 'rehearsal').slice(0, 5)) { updateAuroradeck(d.id, { status: 'idle', touched_by: actor }, actor); }
  for (const p of listProjection().filter((x) => x.status === 'projecting').slice(0, 5)) { updateProjection(p.id, { status: 'idle', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'aurora.light_end', detail: `${ended.length}`, meta: { n: ended.length } });
  return { ok: true, ended, overview: buildAurora() };
}

export function dayAuroraNightmode(input = {}, actor = 'system') {
  const rows = listNightmode().filter((x) => x.status === 'active' || x.status === 'armed');
  const dayed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateNightmode(row.id, { status: 'day', touched_by: actor }, actor);
    if (next) dayed.push(next.id);
  }
  if (!dayed.length) {
    const seeded = createNightmode({ profile: 'day', zone: 'campus', status: 'day' }, actor);
    dayed.push(seeded.id);
  }
  for (const i of listImmersive().filter((x) => x.status === 'running').slice(0, 5)) { updateImmersive(i.id, { status: 'ended', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'ARTE', title: `aurora night_day · ${dayed.length}`, priority: 'normal', payload: { ids: dayed } }, actor);
  appendAudit({ actor, action: 'aurora.night_day', detail: `${dayed.length}`, meta: { n: dayed.length } });
  return { ok: true, dayed, overview: buildAurora() };
}
