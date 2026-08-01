/**
 * AŞAMA 435 — Harbor checkpoint.
 */
import { buildTide } from './tide.js';
import { createHarborlane, listHarborlane, harborlaneSummary, updateHarborlane } from './harborlane.js';
import { createDockslot, listDockslot, dockslotSummary, updateDockslot } from './dockslot.js';
import { createColdbay, listColdbay, coldbaySummary, updateColdbay } from './coldbay.js';
import { createBolthold, listBolthold, boltholdSummary, updateBolthold } from './bolthold.js';
import { createDemurrage, listDemurrage, demurrageSummary, updateDemurrage } from './demurrage.js';
import { createCraneops, listCraneops, craneopsSummary, updateCraneops } from './craneops.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildHarbor() {
  const prev = buildTide();
  const lane = harborlaneSummary();
  const dock = dockslotSummary();
  const cold = coldbaySummary();
  const hold = boltholdSummary();
  const dem = demurrageSummary();
  const crane = craneopsSummary();
  const flags = readCollection('harbor-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Harbor',
    tide: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    laneCongested: lane.congested || 0,
    dockOcc: dock.occupied || 0,
    coldAlarm: cold.alarm || 0,
    holds: hold.hold || 0,
    demAccruing: dem.accruing || 0,
    craneService: crane.service || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      lane_congested: lane.congested || 0,
      cold_alarm: cold.alarm || 0,
      holds: hold.hold || 0,
      dem_accruing: dem.accruing || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Harbor lane congested ${lane.congested || 0} · Dock occupied ${dock.occupied || 0}`,
      `Cold bay alarm ${cold.alarm || 0} · Bolt holds ${hold.hold || 0}`,
      `Demurrage accruing ${dem.accruing || 0} · Crane service ${crane.service || 0}`,
      `Harbor flag ${openFlags.length} açık`,
    ],
  };
}

export function runHarborSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildHarbor();
  const existing = readCollection('harbor-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.coldAlarm || 0) > 0)) {
    candidates.push({ key: 'cold_alarm', level: 'alert', text: `Cold bay alarm ${o.coldAlarm || 0}`, domain: 'cold' });
  }
  if (force || ((o.laneCongested || 0) > 0)) {
    candidates.push({ key: 'lane', level: 'warn', text: `Lane congested ${o.laneCongested || 0}`, domain: 'lane' });
  }
  if (force || ((o.holds || 0) > 0 || (o.demAccruing || 0) > 0)) {
    candidates.push({ key: 'cargo', level: 'info', text: `Holds ${o.holds || 0} · Demurrage ${o.demAccruing || 0}`, domain: 'cargo' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Harbor heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('hbf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('harbor-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ODYSSEUS', title: `harbor sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('hbs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('harbor-sweeps', sweep, 80);
  appendAudit({ actor, action: 'harbor.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildHarbor() };
}

export function ackHarborFlag(input = {}, actor = 'system') {
  const list = readCollection('harbor-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('harbor-flags', list);
  appendAudit({ actor, action: 'harbor.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildHarbor() };
}

export function clearHarborCold(input = {}, actor = 'system') {
  const rows = listColdbay().filter((x) => x.status === 'alarm' || x.status === 'warn');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateColdbay(row.id, { status: 'ok', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createColdbay({ bay: 'H1', tempC: 2, status: 'ok' }, actor);
    cleared.push(seeded.id);
  }
  appendAudit({ actor, action: 'harbor.cold_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildHarbor() };
}

export function releaseHarborHold(input = {}, actor = 'system') {
  const rows = listBolthold().filter((x) => x.status === 'hold');
  const released = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBolthold(row.id, { status: 'released', touched_by: actor }, actor);
    if (next) released.push(next.id);
  }
  if (!released.length) {
    const seeded = createBolthold({ cargo: 'harbor', reason: 'clear', status: 'released' }, actor);
    released.push(seeded.id);
  }
  for (const l of listHarborlane().filter((x) => x.status === 'congested').slice(0, 5)) { updateHarborlane(l.id, { status: 'open', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'harbor.hold_release', detail: `${released.length}`, meta: { n: released.length } });
  return { ok: true, released, overview: buildHarbor() };
}

export function invoiceHarborDemurrage(input = {}, actor = 'system') {
  const rows = listDemurrage().filter((x) => x.status === 'accruing');
  const invoiced = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateDemurrage(row.id, { status: 'invoiced', touched_by: actor }, actor);
    if (next) invoiced.push(next.id);
  }
  if (!invoiced.length) {
    const seeded = createDemurrage({ unit: 'U1', days: 1, status: 'invoiced' }, actor);
    invoiced.push(seeded.id);
  }
  for (const c of listCraneops().filter((x) => x.status === 'service').slice(0, 5)) { updateCraneops(c.id, { status: 'idle', touched_by: actor }, actor); }
  for (const d of listDockslot().filter((x) => x.status === 'occupied').slice(0, 5)) { updateDockslot(d.id, { status: 'free', touched_by: actor }, actor); }
  enqueueAgentJob({ agent: 'ODYSSEUS', title: `harbor dem_invoice · ${invoiced.length}`, priority: 'normal', payload: { ids: invoiced } }, actor);
  appendAudit({ actor, action: 'harbor.dem_invoice', detail: `${invoiced.length}`, meta: { n: invoiced.length } });
  return { ok: true, invoiced, overview: buildHarbor() };
}
