/**
 * AŞAMA 480 — LİKYA Sanctum checkpoint.
 */
import { buildHearth } from './hearth.js';
import { createSpaflow, listSpaflow, spaflowSummary, updateSpaflow } from './spaflow.js';
import { createThermalbay, listThermalbay, thermalbaySummary, updateThermalbay } from './thermalbay.js';
import { createCryochamber, listCryochamber, cryochamberSummary, updateCryochamber } from './cryochamber.js';
import { createMassagebook, listMassagebook, massagebookSummary, updateMassagebook } from './massagebook.js';
import { createYogamat, listYogamat, yogamatSummary, updateYogamat } from './yogamat.js';
import { createBiomarker, listBiomarker, biomarkerSummary, updateBiomarker } from './biomarker.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildSanctum() {
  const prev = buildHearth();
  const spa = spaflowSummary();
  const thermal = thermalbaySummary();
  const cryo = cryochamberSummary();
  const msg = massagebookSummary();
  const yoga = yogamatSummary();
  const bio = biomarkerSummary();
  const flags = readCollection('sanctum-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Sanctum',
    hearth: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    spaInCabin: spa.in_cabin || 0,
    thermalBusy: thermal.busy || 0,
    cryoRunning: cryo.running || 0,
    massageLive: msg.in_session || 0,
    yogaFull: yoga.full || 0,
    bioFlagged: bio.flagged || 0,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      spa_in_cabin: spa.in_cabin || 0,
      thermal_busy: thermal.busy || 0,
      bio_flagged: bio.flagged || 0,
      yoga_full: yoga.full || 0,
    },
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Spa in cabin ${spa.in_cabin || 0} · Thermal busy ${thermal.busy || 0}`,
      `Cryo running ${cryo.running || 0} · Massage in session ${msg.in_session || 0}`,
      `Yoga full ${yoga.full || 0} · Biomarker flagged ${bio.flagged || 0}`,
      `Sanctum flag ${openFlags.length} açık`,
    ],
  };
}

export function runSanctumSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildSanctum();
  const existing = readCollection('sanctum-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || ((o.spaInCabin || 0) > 0)) {
    candidates.push({ key: 'spa_cabin', level: 'info', text: `Spa in cabin ${o.spaInCabin || 0}`, domain: 'spa' });
  }
  if (force || ((o.bioFlagged || 0) > 0)) {
    candidates.push({ key: 'bio_flagged', level: 'alert', text: `Biomarker flagged ${o.bioFlagged || 0}`, domain: 'bio' });
  }
  if (force || ((o.thermalBusy || 0) > 0 || (o.yogaFull || 0) > 0)) {
    candidates.push({ key: 'wellness_load', level: 'warn', text: `Thermal ${o.thermalBusy || 0} · Yoga full ${o.yogaFull || 0}`, domain: 'wellness' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Sanctum heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('snf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('sanctum-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'AURA',
        title: `sanctum sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('sns'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('sanctum-sweeps', sweep, 80);
  appendAudit({ actor, action: 'sanctum.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildSanctum() };
}

export function ackSanctumFlag(input = {}, actor = 'system') {
  const list = readCollection('sanctum-flags', []) || [];
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
  writeCollection('sanctum-flags', list);
  appendAudit({ actor, action: 'sanctum.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildSanctum() };
}

export function clearSanctumSpa(input = {}, actor = 'system') {
  const rows = listSpaflow().filter((x) => x.status === 'in_cabin');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateSpaflow(row.id, { status: 'done', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createSpaflow({ cabin: 'Sanctum', guestName: 'clear', status: 'done' }, actor);
    cleared.push(seeded.id);
  }
  appendAudit({ actor, action: 'sanctum.spa_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildSanctum() };
}

export function clearSanctumBio(input = {}, actor = 'system') {
  const rows = listBiomarker().filter((x) => x.status === 'flagged');
  const cleared = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateBiomarker(row.id, { status: 'reviewed', touched_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createBiomarker({ guestName: 'sanctum', metric: 'HRV', status: 'reviewed' }, actor);
    cleared.push(seeded.id);
  }
  for (const t of listThermalbay().filter((x) => x.status === 'busy').slice(0, 5)) { updateThermalbay(t.id, { status: 'open', touched_by: actor }, actor); }
  for (const y of listYogamat().filter((x) => x.status === 'full').slice(0, 5)) { updateYogamat(y.id, { status: 'open', touched_by: actor }, actor); }
  appendAudit({ actor, action: 'sanctum.bio_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildSanctum() };
}

export function completeSanctumSession(input = {}, actor = 'system') {
  const rows = listMassagebook().filter((x) => x.status === 'in_session' || x.status === 'booked');
  const completed = [];
  for (const row of rows.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = updateMassagebook(row.id, { status: 'done', touched_by: actor }, actor);
    if (next) completed.push(next.id);
  }
  if (!completed.length) {
    const seeded = createMassagebook({ therapy: 'sanctum', therapist: 'ops', status: 'done' }, actor);
    completed.push(seeded.id);
  }
  for (const c of listCryochamber().filter((x) => x.status === 'running').slice(0, 5)) { updateCryochamber(c.id, { status: 'done', touched_by: actor }, actor); }
  enqueueAgentJob(
    {
      agent: 'AURA',
      title: `sanctum session_complete · ${completed.length}`,
      priority: 'normal',
      payload: { ids: completed },
    },
    actor,
  );
  appendAudit({ actor, action: 'sanctum.session_complete', detail: `${completed.length}`, meta: { n: completed.length } });
  return { ok: true, completed, overview: buildSanctum() };
}
