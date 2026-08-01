/**
 * AŞAMA 975 — Serenity2 checkpoint.
 */
import { buildDominion2 } from './dominion2.js';
import { createLegacyflag2, listLegacyflag2, legacyflag2Summary, updateLegacyflag2 } from './legacyflag2.js';
import { createQuiethours2, listQuiethours2, quiethours2Summary, updateQuiethours2 } from './quiethours2.js';
import { createPillowmenu3, listPillowmenu3, pillowmenu3Summary, updatePillowmenu3 } from './pillowmenu3.js';
import { createSleepscore2, listSleepscore2, sleepscore2Summary, updateSleepscore2 } from './sleepscore2.js';
import { createFarewell2, listFarewell2, farewell2Summary, updateFarewell2 } from './farewell2.js';
import { createCarecall2, listCarecall2, carecall2Summary, updateCarecall2 } from './carecall2.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildSerenity2() {
  const prev = buildDominion2();
  const s0 = legacyflag2Summary();
  const s1 = quiethours2Summary();
  const s2 = pillowmenu3Summary();
  const s3 = sleepscore2Summary();
  const s4 = farewell2Summary();
  const s5 = carecall2Summary();
  const flags = readCollection('serenity2-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Serenity2',
    dominion2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    legacyflag2Sig: s0.open || 0,
    quiethours2Sig: s1.draft || 0,
    pillowmenu3Sig: s2.planned || 0,
    sleepscore2Sig: s3.idle || 0,
    farewell2Sig: s4.open || 0,
    carecall2Sig: s5.draft || 0,
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
      `Serenity2 flag ${openFlags.length} açık`,
    ],
  };
}

export function runSerenity2Sweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildSerenity2();
  const existing = readCollection('serenity2-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.legacyflag2Sig || 0) > 0 || (o.farewell2Sig || 0) > 0)) {
    candidates.push({ key: 'legacy', level: 'alert', text: `Legacy open ${o.legacyflag2Sig || 0} · Farewell ${o.farewell2Sig || 0}`, domain: 'legacy' });
  }
  if (force || ((o.quiethours2Sig || 0) > 0 || (o.carecall2Sig || 0) > 0)) {
    candidates.push({ key: 'quiet', level: 'warn', text: `Quiet draft ${o.quiethours2Sig || 0} · Care ${o.carecall2Sig || 0}`, domain: 'quiet' });
  }
  if (force || ((o.pillowmenu3Sig || 0) > 0 || (o.sleepscore2Sig || 0) > 0)) {
    candidates.push({ key: 'pillow', level: 'info', text: `Pillow planned ${o.pillowmenu3Sig || 0} · Sleep idle ${o.sleepscore2Sig || 0}`, domain: 'pillow' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Serenity2 heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('sy2f'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('serenity2-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `serenity2 sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('sy2s'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('serenity2-sweeps', sweep, 80);
  appendAudit({ actor, action: 'serenity2.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildSerenity2() };
}

export function ackSerenity2Flag(input = {}, actor = 'system') {
  const list = readCollection('serenity2-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('serenity2-flags', list);
  appendAudit({ actor, action: 'serenity2.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildSerenity2() };
}

export function closeSerenity2Legacy(input = {}, actor = 'system') {
  const rows = listLegacyflag2().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateLegacyflag2(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createLegacyflag2({ system: 'serenity2', flag: 'ok', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const f of listFarewell2().filter((x) => x.status === 'open' || x.status === 'active').slice(0, 5)) {
    updateFarewell2(f.id, { status: 'closed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'serenity2.legacy_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildSerenity2() };
}

export function liveSerenity2Quiet(input = {}, actor = 'system') {
  const rows = listQuiethours2().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateQuiethours2(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createQuiethours2({ zone: 'serenity2', profile: 'ok', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const c of listCarecall2().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateCarecall2(c.id, { status: 'live', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'serenity2.quiet_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildSerenity2() };
}

export function runSerenity2Pillow(input = {}, actor = 'system') {
  const rows = listPillowmenu3().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePillowmenu3(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createPillowmenu3({ room: 'serenity2', choice: 'ok', status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const s of listSleepscore2().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateSleepscore2(s.id, { status: 'busy', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `serenity2 pillow_run · ${ran.length}`, priority: 'normal', payload: { ids: ran } }, actor);
  appendAudit({ actor, action: 'serenity2.pillow_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildSerenity2() };
}
