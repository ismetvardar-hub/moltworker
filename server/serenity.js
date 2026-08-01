/**
 * AŞAMA 765 — Serenity checkpoint.
 */
import { buildDominion } from './dominion.js';
import { createLegacyflag, listLegacyflag, legacyflagSummary, updateLegacyflag } from './legacyflag.js';
import { createQuiethours, listQuiethours, quiethoursSummary, updateQuiethours } from './quiethours.js';
import { createPillowmenu2, listPillowmenu2, pillowmenu2Summary, updatePillowmenu2 } from './pillowmenu2.js';
import { createSleepscore, listSleepscore, sleepscoreSummary, updateSleepscore } from './sleepscore.js';
import { createFarewell, listFarewell, farewellSummary, updateFarewell } from './farewell.js';
import { createCarecall, listCarecall, carecallSummary, updateCarecall } from './carecall.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`; }

export function buildSerenity() {
  const prev = buildDominion();
  const s0 = legacyflagSummary();
  const s1 = quiethoursSummary();
  const s2 = pillowmenu2Summary();
  const s3 = sleepscoreSummary();
  const s4 = farewellSummary();
  const s5 = carecallSummary();
  const flags = readCollection('serenity-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Serenity',
    dominion: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    legacyflagSig: s0.open || 0,
    quiethoursSig: s1.draft || 0,
    pillowmenu2Sig: s2.planned || 0,
    sleepscoreSig: s3.idle || 0,
    farewellSig: s4.open || 0,
    carecallSig: s5.draft || 0,
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
      `Serenity flag ${openFlags.length} açık`,
    ],
  };
}

export function runSerenitySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildSerenity();
  const existing = readCollection('serenity-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.legacyflagSig || 0) > 0 || (o.farewellSig || 0) > 0)) {
    candidates.push({ key: 'legacy', level: 'alert', text: `Legacy open ${o.legacyflagSig || 0} · Farewell ${o.farewellSig || 0}`, domain: 'legacy' });
  }
  if (force || ((o.quiethoursSig || 0) > 0 || (o.carecallSig || 0) > 0)) {
    candidates.push({ key: 'quiet', level: 'warn', text: `Quiet draft ${o.quiethoursSig || 0} · Care ${o.carecallSig || 0}`, domain: 'quiet' });
  }
  if (force || ((o.pillowmenu2Sig || 0) > 0 || (o.sleepscoreSig || 0) > 0)) {
    candidates.push({ key: 'pillow', level: 'info', text: `Pillow planned ${o.pillowmenu2Sig || 0} · Sleep idle ${o.sleepscoreSig || 0}`, domain: 'pillow' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Serenity heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('snyf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row); created.push(row); openKeys.add(c.key);
  }
  writeCollection('serenity-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob({ agent: 'ETHOS', title: `serenity sweep · ${created.length} flag`, priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal', payload: { flag_ids: created.map((f) => f.id) } }, actor);
  }
  const sweep = { id: rid('snys'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('serenity-sweeps', sweep, 80);
  appendAudit({ actor, action: 'serenity.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildSerenity() };
}

export function ackSerenityFlag(input = {}, actor = 'system') {
  const list = readCollection('serenity-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = { ...list[idx], status: 'acked', note: String(input.note || '').slice(0, 240) || undefined, acked_at: new Date().toISOString(), acked_by: actor };
  writeCollection('serenity-flags', list);
  appendAudit({ actor, action: 'serenity.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildSerenity() };
}

export function closeSerenityLegacy(input = {}, actor = 'system') {
  const rows = listLegacyflag().filter((x) => x.status === 'open' || x.status === 'active');
  const closed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateLegacyflag(row.id, { status: 'closed', touched_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createLegacyflag({ system: 'serenity', flag: 'ok', status: 'closed' }, actor);
    closed.push(seeded.id);
  }
  for (const f of listFarewell().filter((x) => x.status === 'open' || x.status === 'active').slice(0, 5)) {
    updateFarewell(f.id, { status: 'closed', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'serenity.legacy_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildSerenity() };
}

export function liveSerenityQuiet(input = {}, actor = 'system') {
  const rows = listQuiethours().filter((x) => x.status === 'draft');
  const lived = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateQuiethours(row.id, { status: 'live', touched_by: actor }, actor);
    if (next) lived.push(next.id);
  }
  if (!lived.length) {
    const seeded = createQuiethours({ zone: 'serenity', profile: 'ok', status: 'live' }, actor);
    lived.push(seeded.id);
  }
  for (const c of listCarecall().filter((x) => x.status === 'draft').slice(0, 5)) {
    updateCarecall(c.id, { status: 'live', touched_by: actor }, actor);
  }
  appendAudit({ actor, action: 'serenity.quiet_live', detail: `${lived.length}`, meta: { n: lived.length } });
  return { ok: true, lived, overview: buildSerenity() };
}

export function runSerenityPillow(input = {}, actor = 'system') {
  const rows = listPillowmenu2().filter((x) => x.status === 'planned');
  const ran = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updatePillowmenu2(row.id, { status: 'doing', touched_by: actor }, actor);
    if (next) ran.push(next.id);
  }
  if (!ran.length) {
    const seeded = createPillowmenu2({ room: 'serenity', choice: 'ok', status: 'doing' }, actor);
    ran.push(seeded.id);
  }
  for (const s of listSleepscore().filter((x) => x.status === 'idle' || x.status === 'fault').slice(0, 5)) {
    updateSleepscore(s.id, { status: 'busy', touched_by: actor }, actor);
  }
  enqueueAgentJob({ agent: 'ETHOS', title: `serenity pillow_run · ${ran.length}`, priority: 'normal', payload: { ids: ran } }, actor);
  appendAudit({ actor, action: 'serenity.pillow_run', detail: `${ran.length}`, meta: { n: ran.length } });
  return { ok: true, ran, overview: buildSerenity() };
}
