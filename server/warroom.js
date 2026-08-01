/**
 * AŞAMA 105 — War Room checkpoint (boardpack + saha/uyum sinyalleri).
 */
import { buildBoardpack } from './boardpack.js';
import { flashSummary } from './flash.js';
import { createHaccp, haccpSummary, listHaccp, updateHaccp } from './haccp.js';
import { createPatrol, listPatrol, patrolSummary, updatePatrol } from './patrol.js';
import { fleetSummary } from './fleet.js';
import { createFolio, folioSummary, listFolio, updateFolio } from './folio.js';
import { createConcierge, conciergeSummary, listConcierge, updateConcierge } from './concierge.js';
import { banquetSummary } from './banquet.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

export function buildWarroom() {
  const pack = buildBoardpack();
  const flash = flashSummary();
  const haccp = haccpSummary();
  const patrol = patrolSummary();
  const fleet = fleetSummary();
  const folio = folioSummary();
  const concierge = conciergeSummary();
  const banquet = banquetSummary();
  const alerts = [];
  if ((haccp.fail || 0) > 0) alerts.push(`HACCP fail ${haccp.fail}`);
  if ((patrol.alert || 0) > 0) alerts.push(`Patrol alert ${patrol.alert}`);
  if ((fleet.service || 0) > 0) alerts.push(`Filo servis ${fleet.service}`);
  if ((concierge.open || 0) > 0) alerts.push(`Açık concierge ${concierge.open}`);
  const flags = readCollection('warroom-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA War Room',
    boardpack: {
      readiness: pack.readiness,
      summaryLines: pack.summaryLines,
    },
    flashTotal: flash.total,
    flashPublished: flash.published || 0,
    haccpFail: haccp.fail || 0,
    patrolAlert: patrol.alert || 0,
    fleetOnTrip: fleet.on_trip || 0,
    folioOpen: folio.open || 0,
    conciergeOpen: concierge.open || 0,
    banquetConfirmed: banquet.confirmed || 0,
    alerts,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      haccp_fail: haccp.fail || 0,
      patrol_alert: patrol.alert || 0,
      concierge_open: concierge.open || 0,
      folio_open: folio.open || 0,
    },
    summaryLines: [
      ...(pack.summaryLines || []).slice(0, 3),
      `Flash satır ${flash.total} (yayın ${flash.published || 0})`,
      `Folio açık ${folio.open || 0}`,
      `Concierge açık ${concierge.open || 0}`,
      `HACCP fail ${haccp.fail || 0} · Patrol alert ${patrol.alert || 0}`,
      `Filo seferde ${fleet.on_trip || 0} · Banket onaylı ${banquet.confirmed || 0}`,
      `War Room flag ${openFlags.length} açık`,
      ...alerts.slice(0, 3),
    ],
  };
}

export function runWarroomSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const wr = buildWarroom();
  const existing = readCollection('warroom-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (wr.haccpFail || 0) > 0) {
    candidates.push({ key: 'haccp_fail', level: 'alert', text: `HACCP fail ${wr.haccpFail || 0}`, domain: 'haccp' });
  }
  if (force || (wr.patrolAlert || 0) > 0) {
    candidates.push({ key: 'patrol_alert', level: 'alert', text: `Patrol alert ${wr.patrolAlert || 0}`, domain: 'patrol' });
  }
  if (force || (wr.conciergeOpen || 0) > 0) {
    candidates.push({ key: 'concierge_open', level: 'warn', text: `Concierge açık ${wr.conciergeOpen || 0}`, domain: 'concierge' });
  }
  if (force || (wr.folioOpen || 0) > 3) {
    candidates.push({ key: 'folio_open', level: 'info', text: `Folio açık ${wr.folioOpen || 0}`, domain: 'folio' });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'War Room heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('wrf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('warroom-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'LİKYA-1',
        title: `warroom sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('wrs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('warroom-sweeps', sweep, 80);
  appendAudit({ actor, action: 'warroom.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildWarroom() };
}

export function ackWarroomFlag(input = {}, actor = 'system') {
  const list = readCollection('warroom-flags', []) || [];
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
  writeCollection('warroom-flags', list);
  appendAudit({ actor, action: 'warroom.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildWarroom() };
}

export function clearWarroomHaccp(input = {}, actor = 'system') {
  const fails = listHaccp().filter((h) => h.status === 'fail');
  const cleared = [];
  for (const h of fails.slice(0, Number(input.limit) || 20)) {
    if (input.id && h.id !== input.id) continue;
    const next = updateHaccp(h.id, { status: 'pass', cleared_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createHaccp({ checkpoint: input.checkpoint || 'WarRoom', status: 'pass' }, actor);
    cleared.push(seeded.id);
  }
  appendAudit({ actor, action: 'warroom.haccp_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildWarroom() };
}

export function clearWarroomPatrol(input = {}, actor = 'system') {
  const alerts = listPatrol().filter((p) => p.status === 'alert');
  const cleared = [];
  for (const p of alerts.slice(0, Number(input.limit) || 20)) {
    if (input.id && p.id !== input.id) continue;
    const next = updatePatrol(p.id, { status: 'ok', cleared_by: actor }, actor);
    if (next) cleared.push(next.id);
  }
  if (!cleared.length) {
    const seeded = createPatrol({ zone: input.zone || 'Kampüs', status: 'ok', note: 'warroom clear' }, actor);
    cleared.push(seeded.id);
  }
  appendAudit({ actor, action: 'warroom.patrol_clear', detail: `${cleared.length}`, meta: { n: cleared.length } });
  return { ok: true, cleared, overview: buildWarroom() };
}

export function closeWarroomConcierge(input = {}, actor = 'system') {
  const open = listConcierge().filter((c) => c.status === 'open');
  const closed = [];
  for (const c of open.slice(0, Number(input.limit) || 20)) {
    if (input.id && c.id !== input.id) continue;
    const next = updateConcierge(c.id, { status: 'done', closed_by: actor }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createConcierge({ request: 'warroom close-seed', status: 'done' }, actor);
    closed.push(seeded.id);
  }
  // folio yan temizliği (isteğe bağlı)
  if (input.close_folio) {
    for (const f of listFolio().filter((x) => x.status === 'open').slice(0, 5)) {
      updateFolio(f.id, { status: 'closed' }, actor);
    }
  } else if (!listFolio().length) {
    createFolio({ guestName: 'WarRoom', status: 'closed' }, actor);
  }
  enqueueAgentJob(
    {
      agent: 'DAZE-CREW',
      title: `warroom concierge close · ${closed.length}`,
      priority: 'normal',
      payload: { ids: closed },
    },
    actor,
  );
  appendAudit({ actor, action: 'warroom.concierge_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildWarroom() };
}
