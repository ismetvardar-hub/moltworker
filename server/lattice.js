/**
 * AŞAMA 345 — Lattice checkpoint.
 */
import { buildVanguard } from './vanguard.js';
import { createEdgegate, listEdgegate, edgegateSummary, updateEdgegate } from './edgegate.js';
import { createMeshlink, listMeshlink, meshlinkSummary, updateMeshlink } from './meshlink.js';
import { createOtafirm, listOtafirm, otafirmSummary, updateOtafirm } from './otafirm.js';
import { createSyncrepl, listSyncrepl, syncreplSummary, updateSyncrepl } from './syncrepl.js';
import { createBackhaul, listBackhaul, backhaulSummary, updateBackhaul } from './backhaul.js';
import { createFailover, listFailover, failoverSummary, updateFailover } from './failover.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildLattice() {
  const prev = buildVanguard();
  const gate = edgegateSummary();
  const mesh = meshlinkSummary();
  const ota = otafirmSummary();
  const sync = syncreplSummary();
  const bh = backhaulSummary();
  const fo = failoverSummary();
  const flags = readCollection('lattice-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Lattice',
    vanguard: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    gateOffline: gate.offline || 0,
    meshDown: mesh.down || 0,
    otaFailed: ota.failed || 0,
    syncLag: sync.lagging || 0,
    backhaulDown: bh.down || 0,
    failoverActive: fo.active || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      gate_offline: gate.offline || 0,
      mesh_down: mesh.down || 0,
      ota_failed: ota.failed || 0,
      failover_active: fo.active || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Edge gate offline ${gate.offline || 0} · Mesh down ${mesh.down || 0}`,
      `OTA fail ${ota.failed || 0} · Sync lagging ${sync.lagging || 0}`,
      `Backhaul down ${bh.down || 0} · Failover active ${fo.active || 0}`,
      `Lattice flag ${openFlags.length} açık`,
    ],
  };
}

export function runLatticeSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildLattice();
  const existing = readCollection('lattice-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.gateOffline || 0) > 0 || (o.meshDown || 0) > 0)) {
    candidates.push({ key: 'gate', level: 'alert', text: `Gate offline ${o.gateOffline || 0} · Mesh down ${o.meshDown || 0}`, domain: 'gate' });
  }
  if (force || ((o.otaFailed || 0) > 0 || (o.syncLag || 0) > 0)) {
    candidates.push({ key: 'ota', level: 'warn', text: `OTA fail ${o.otaFailed || 0} · Sync lag ${o.syncLag || 0}`, domain: 'ota' });
  }
  if (force || ((o.failoverActive || 0) > 0 || (o.backhaulDown || 0) > 0)) {
    candidates.push({ key: 'failback', level: 'info', text: `Failover ${o.failoverActive || 0} · Backhaul ${o.backhaulDown || 0}`, domain: 'failback' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Lattice heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('ltf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('lattice-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'NEXUS', title: `lattice sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('lts'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('lattice-sweeps', sweep, 80);
  appendAudit({ actor, action: 'lattice.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildLattice() };
}

export function ackLatticeFlag(input = {}, actor = 'system') {
  const list = readCollection('lattice-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('lattice-flags', list);
  appendAudit({ actor, action: 'lattice.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildLattice() };
}

export function healLatticeGate(input = {}, actor = 'system') {
  const rows = listEdgegate().filter((x) => x.status === 'offline' || x.status === 'degraded');
  const healed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateEdgegate(row.id, { status: 'online', touched_by: actor }, actor);
    if (next) healed.push(next.id);
  }
  if (!healed.length) {
    const seeded = createEdgegate({ node: 'lattice', zone: 'ops', status: 'online' }, actor);
    healed.push(seeded.id);
  }
  for (const m of listMeshlink().filter((x) => x.status === 'down' || x.status === 'flap').slice(0, 5)) {
    updateMeshlink(m.id, { status: 'up', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'lattice.gate_heal', detail: `${healed.length}`, meta: { n: healed.length } });
  return { ok: true, healed, overview: buildLattice() };
}

export function retryLatticeOta(input = {}, actor = 'system') {
  const rows = listOtafirm().filter((x) => x.status === 'failed' || x.status === 'queued');
  const retried = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateOtafirm(row.id, { status: 'flashing', touched_by: actor }, actor);
    if (next) retried.push(next.id);
  }
  if (!retried.length) {
    const seeded = createOtafirm({ device: 'lattice', version: '2.4.1', status: 'flashing' }, actor);
    retried.push(seeded.id);
  }
  for (const s of listSyncrepl().filter((x) => x.status === 'lagging' || x.status === 'broken').slice(0, 5)) {
    updateSyncrepl(s.id, { status: 'synced', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'lattice.ota_retry', detail: `${retried.length}`, meta: { n: retried.length } });
  return { ok: true, retried, overview: buildLattice() };
}

export function clearLatticeFailback(input = {}, actor = 'system') {
  const rows = listFailover().filter((x) => x.status === 'active' || x.status === 'failback');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateFailover(row.id, { status: 'standby', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createFailover({ pair: 'lattice', reason: 'ok', status: 'standby' }, actor);
    cleared.push(seeded.id);
  }
  for (const b of listBackhaul().filter((x) => x.status === 'down' || x.status === 'congested').slice(0, 5)) {
    updateBackhaul(b.id, { status: 'up', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'NEXUS', title: `lattice failback_clear · ${cleared.length}`, priority: 'normal', payload: { ids: cleared } }, actor);
  appendAudit({ actor, action: 'lattice.failback_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildLattice() };
}
