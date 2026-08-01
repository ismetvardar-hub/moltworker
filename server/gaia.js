/**
 * AŞAMA 1125 — Gaia checkpoint.
 */
import { buildSelene } from './selene.js';
import { createLegacyflag3, listLegacyflag3, legacyflag3Summary, updateLegacyflag3 } from './legacyflag3.js';
import { createQuiethours3, listQuiethours3, quiethours3Summary, updateQuiethours3 } from './quiethours3.js';
import { createPillowmenu4, listPillowmenu4, pillowmenu4Summary, updatePillowmenu4 } from './pillowmenu4.js';
import { createSleepscore3, listSleepscore3, sleepscore3Summary, updateSleepscore3 } from './sleepscore3.js';
import { createFarewell3, listFarewell3, farewell3Summary, updateFarewell3 } from './farewell3.js';
import { createCarecall3, listCarecall3, carecall3Summary, updateCarecall3 } from './carecall3.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildGaia() {
  const prev = buildSelene();
  const s0 = legacyflag3Summary();
  const s1 = quiethours3Summary();
  const s2 = pillowmenu4Summary();
  const s3 = sleepscore3Summary();
  const s4 = farewell3Summary();
  const s5 = carecall3Summary();
  const flags = readCollection('gaia-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Gaia',
    selene: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    legacyflag3Sig: s0.open || 0,
    quiethours3Sig: s1.draft || 0,
    pillowmenu4Sig: s2.planned || 0,
    sleepscore3Sig: s3.idle || 0,
    farewell3Sig: s4.open || 0,
    carecall3Sig: s5.draft || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      legacy_open: s0.open || 0,
      quiet_draft: s1.draft || 0,
      pillow_planned: s2.planned || 0,
      sleep_idle: s3.idle || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Legacy Flag ${s0.open || 0} · Quiet Hours ${s1.draft || 0}`,
      `Pillow Menu ${s2.planned || 0} · Sleep Score ${s3.idle || 0}`,
      `Farewell ${s4.open || 0} · Care Call ${s5.draft || 0}`,
      `Gaia flag ${openFlags.length} açık`,
    ],
  };
}

export function runGaiaSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildGaia();
  const existing = readCollection('gaia-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.legacyflag3Sig || 0) > 0 || (o.farewell3Sig || 0) > 0)) {
    candidates.push({ key: 'legacy', level: 'alert', text: `Legacy open ${o.legacyflag3Sig || 0} · Farewell ${o.farewell3Sig || 0}`, domain: 'legacy' });
  }
  if (force || ((o.quiethours3Sig || 0) > 0 || (o.carecall3Sig || 0) > 0)) {
    candidates.push({ key: 'quiet', level: 'warn', text: `Quiet draft ${o.quiethours3Sig || 0} · Care ${o.carecall3Sig || 0}`, domain: 'quiet' });
  }
  if (force || ((o.pillowmenu4Sig || 0) > 0 || (o.sleepscore3Sig || 0) > 0)) {
    candidates.push({ key: 'pillow', level: 'info', text: `Pillow planned ${o.pillowmenu4Sig || 0} · Sleep idle ${o.sleepscore3Sig || 0}`, domain: 'pillow' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Gaia heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('gaf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('gaia-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `gaia sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('gas'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('gaia-sweeps', sweep, 80);
  appendAudit({ actor, action: 'gaia.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildGaia() };
}

export function ackGaiaFlag(input = {}, actor = 'system') {
  const list = readCollection('gaia-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('gaia-flags', list);
  appendAudit({ actor, action: 'gaia.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildGaia() };
}

export function closeGaiaLegacy(input = {}, actor = 'system') {
  const rows = listLegacyflag3().filter((x) => x.status === 'open');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateLegacyflag3(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createLegacyflag3({ system: 'gaia', flag: 'ok', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const f of listFarewell3().filter((x) => x.status === 'open').slice(0, 5)) {
    updateFarewell3(f.id, { status: 'closed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'gaia.legacy_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildGaia() };
}

export function liveGaiaQuiet(input = {}, actor = 'system') {
  const rows = listQuiethours3().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateQuiethours3(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createQuiethours3({ zone: 'gaia', profile: 'night', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const c of listCarecall3().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateCarecall3(c.id, { status: 'live', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'gaia.quiet_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildGaia() };
}

export function runGaiaPillow(input = {}, actor = 'system') {
  const rows = listPillowmenu4().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePillowmenu4(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createPillowmenu4({ room: 'gaia', choice: 'firm', status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const s of listSleepscore3().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateSleepscore3(s.id, { status: 'busy', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `gaia pillow_run · ${ran.length}`, priority: 'normal', payload: { ids: ran } }, actor);
  appendAudit({ actor, action: 'gaia.pillow_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildGaia() };
}
