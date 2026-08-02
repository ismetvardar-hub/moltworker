/**
 * AŞAMA 60 — Operasyon hazırlık skoru (checkpoint panosu).
 */
import { inventorySummary } from './inventory.js';
import { incidentsSummary, listIncidents } from './incidents.js';
import { shiftsSummary } from './shifts.js';
import { checklistsSummary } from './checklists.js';
import { coldchainSummary } from './coldchain.js';
import { maintenanceSummary } from './maintenance.js';
import { complaintsSummary } from './complaints.js';
import { seatingSummary } from './seating.js';
import { waitlistSummary } from './waitlist.js';
import { wasteSummary } from './waste.js';
import { campusHealthCheck } from './campusbrief.js';
import { agentQueueOverview, enqueueAgentJob } from './agentqueue.js';
import { greenPulseOverview } from './greenpulse.js';
import { campusCoreOverview } from './campuscore.js';
import { agentBridgeOverview } from './agentbridge.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function loadThresholds() {
  const defaults = { warn: 70, alert: 55, critical: 40 };
  const stored = readCollection('readiness-thresholds', null);
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    return {
      warn: Number(stored.warn) || defaults.warn,
      alert: Number(stored.alert) || defaults.alert,
      critical: Number(stored.critical) || defaults.critical,
    };
  }
  if (Array.isArray(stored) && stored[0]) {
    return {
      warn: Number(stored[0].warn) || defaults.warn,
      alert: Number(stored[0].alert) || defaults.alert,
      critical: Number(stored[0].critical) || defaults.critical,
    };
  }
  return defaults;
}

export function buildReadiness() {
  const inv = inventorySummary();
  const inc = incidentsSummary();
  const sh = shiftsSummary();
  const chk = checklistsSummary();
  const cc = coldchainSummary();
  const mnt = maintenanceSummary();
  const cmp = complaintsSummary();
  const seat = seatingSummary();
  const wl = waitlistSummary();
  const wst = wasteSummary();

  const openCritical = listIncidents().filter(
    (i) => i.status === 'open' && (i.severity === 'critical' || i.severity === 'error'),
  ).length;

  const dimensions = [
    {
      id: 'stock',
      label: 'Stok',
      score: clamp(100 - (inv.lowStock || 0) * 12),
      detail: `${inv.lowStock || 0} düşük SKU`,
    },
    {
      id: 'incidents',
      label: 'Olaylar',
      score: clamp(100 - (inc.open || 0) * 8 - openCritical * 15),
      detail: `${inc.open} açık · ${openCritical} kritik`,
    },
    {
      id: 'crew',
      label: 'Vardiya',
      score: clamp(sh.todayCount > 0 ? 70 + Math.min(30, sh.todayCount * 5) : 40),
      detail: `Bugün ${sh.todayCount} vardiya`,
    },
    {
      id: 'checklists',
      label: 'Checklist',
      score: clamp(80 + (chk.completedToday || 0) * 5 - (chk.openRuns || 0) * 10),
      detail: `${chk.openRuns} açık run`,
    },
    {
      id: 'coldchain',
      label: 'Soğuk zincir',
      score: clamp(100 - (cc.recentAlerts || 0) * 20),
      detail: `${cc.recentAlerts || 0} alarm`,
    },
    {
      id: 'maintenance',
      label: 'Bakım',
      score: clamp(100 - (mnt.open || 0) * 10 - (mnt.critical || 0) * 15),
      detail: `${mnt.open} açık ticket`,
    },
    {
      id: 'guest',
      label: 'Misafir',
      score: clamp(100 - (cmp.open || 0) * 12 - Math.min(20, wl.waiting || 0) * 2),
      detail: `${cmp.open} şikayet · ${wl.waiting} bekleyen`,
    },
    {
      id: 'floor',
      label: 'Salon',
      score: clamp(
        seat.total
          ? ((seat.free + seat.reserved * 0.5) / seat.total) * 100
          : 70,
      ),
      detail: `${seat.free} boş / ${seat.total} masa`,
    },
  ];

  const campus = campusHealthCheck();
  const queue = agentQueueOverview();
  const green = greenPulseOverview();
  const core = campusCoreOverview();
  const bridge = agentBridgeOverview();
  const openWo = core.summary?.open_work_orders || 0;
  const escWo = core.summary?.escalated_work_orders || 0;
  const inProgWo = core.summary?.in_progress_work_orders || 0;
  const bridgeAlerts = bridge.summary?.alerts_open || 0;
  const bridgeSla = bridge.summary?.alerts_sla_breach || 0;
  const bridgeChannels = bridge.summary?.channels_open || 0;
  dimensions.push(
    {
      id: 'campus',
      label: 'Kampüs',
      score: clamp(campus.score ?? 70),
      detail: `${campus.status} · ${campus.alerts || 0} alert · ${campus.warns || 0} warn`,
    },
    {
      id: 'agents',
      label: 'Ajan kuyruk',
      score: clamp(
        100 -
          (queue.summary?.queued || 0) * 3 -
          (queue.summary?.sla_breach || 0) * 8 -
          (queue.summary?.failed || 0) * 10,
      ),
      detail: `${queue.summary?.queued || 0} kuyruk · ${queue.summary?.sla_breach || 0} SLA`,
    },
    {
      id: 'esg',
      label: 'ESG',
      score: clamp(green.summary?.score ?? 50),
      detail: `${green.summary?.alerts || 0} alert · orman ${green.summary?.forest_ha || 0} ha`,
    },
    {
      id: 'work_orders',
      label: 'İş emri',
      score: clamp(100 - openWo * 8 - escWo * 12 - inProgWo * 3),
      detail: `${openWo} açık · ${escWo} escalate · ${inProgWo} devam`,
    },
    {
      id: 'bridge',
      label: 'Köprü',
      score: clamp(100 - bridgeAlerts * 10 - bridgeSla * 15),
      detail: `${bridgeAlerts} alert · ${bridgeChannels} kanal · SLA ${bridgeSla}`,
    },
  );

  const overall = clamp(
    dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length,
  );

  let grade = 'C';
  if (overall >= 90) grade = 'A';
  else if (overall >= 75) grade = 'B';
  else if (overall >= 60) grade = 'C';
  else grade = 'D';

  const thresholds = loadThresholds();
  const acks = readCollection('readiness-acks', []) || [];
  const ackList = Array.isArray(acks) ? acks : [];
  const openAcks = new Set(
    ackList.filter((a) => a.status === 'acked').map((a) => a.dimension_id),
  );
  const gaps = readCollection('readiness-gaps', []) || [];
  const gapList = Array.isArray(gaps) ? gaps : [];
  const openGaps = gapList.filter((g) => g.status === 'open');
  const snapshots = readCollection('readiness-snapshots', []) || [];
  const flags = readCollection('readiness-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');

  const enriched = dimensions.map((d) => {
    let level = 'ok';
    if (d.score < thresholds.critical) level = 'critical';
    else if (d.score < thresholds.alert) level = 'alert';
    else if (d.score < thresholds.warn) level = 'warn';
    return {
      ...d,
      level,
      acked: openAcks.has(d.id),
      below_threshold: d.score < thresholds.warn,
    };
  });

  const dimsWarn = enriched.filter((d) => d.level === 'warn').length;
  const dimsAlert = enriched.filter((d) => d.level === 'alert' || d.level === 'critical').length;

  return {
    overall,
    grade,
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Hazırlık Skoru',
    dimensions: enriched,
    thresholds,
    gaps: openGaps.slice(0, 20),
    snapshots: (Array.isArray(snapshots) ? snapshots : []).slice(0, 10),
    flags: openFlags.slice(0, 30),
    campus,
    signals: {
      lowStock: inv.lowStock,
      openIncidents: inc.open,
      coldAlerts: cc.recentAlerts,
      openComplaints: cmp.open,
      todayWasteCost: wst.todayCost,
      waitingGuests: wl.waiting,
      campusScore: campus.score,
      campusStatus: campus.status,
      queueQueued: queue.summary?.queued,
      esgScore: green.summary?.score,
      openWorkOrders: openWo,
      escalatedWorkOrders: escWo,
      bridgeAlerts,
      bridgeSla,
      bridgeChannels,
    },
    summary: {
      overall,
      grade,
      flags_open: openFlags.length,
      dims_warn: dimsWarn,
      dims_alert: dimsAlert,
      dims_acked: enriched.filter((d) => d.acked).length,
      gaps_open: openGaps.length,
      snapshots: Array.isArray(snapshots) ? snapshots.length : 0,
    },
    summaryLines: [
      `Skor ${overall} · ${grade}`,
      `Warn ${dimsWarn} · alert ${dimsAlert} · gap ${openGaps.length}`,
      `Readiness flag ${openFlags.length} açık`,
    ],
  };
}

/** Anlık hazırlık snapshot kaydet */
export function refreshReadinessSnapshot(input = {}, actor = 'system') {
  const board = buildReadiness();
  const snapshot = {
    id: rid('rds'),
    overall: board.overall,
    grade: board.grade,
    dims_alert: board.summary?.dims_alert || 0,
    dims_warn: board.summary?.dims_warn || 0,
    note: String(input.note || '').slice(0, 240) || undefined,
    dimensions: (board.dimensions || []).map((d) => ({
      id: d.id,
      score: d.score,
      level: d.level,
    })),
    at: new Date().toISOString(),
    actor,
  };
  prependItem('readiness-snapshots', snapshot, 120);
  appendAudit({
    actor,
    action: 'readiness.snapshot',
    detail: `skor ${snapshot.overall} · ${snapshot.grade}`,
    meta: { id: snapshot.id },
  });
  return { ok: true, snapshot, overview: buildReadiness() };
}

/** Uyarı eşiklerini ayarla */
export function setReadinessThreshold(input = {}, actor = 'system') {
  const current = loadThresholds();
  const next = {
    warn: Math.max(1, Math.min(99, Number(input.warn) || current.warn)),
    alert: Math.max(1, Math.min(99, Number(input.alert) || current.alert)),
    critical: Math.max(1, Math.min(99, Number(input.critical) || current.critical)),
    updated_at: new Date().toISOString(),
    updated_by: actor,
  };
  if (next.critical > next.alert) next.critical = next.alert;
  if (next.alert > next.warn) next.alert = next.warn;
  writeCollection('readiness-thresholds', next);
  appendAudit({
    actor,
    action: 'readiness.threshold',
    detail: `warn ${next.warn} · alert ${next.alert} · crit ${next.critical}`,
    meta: next,
  });
  return { ok: true, thresholds: next, overview: buildReadiness() };
}

/** Boyut ack — düşük skor bilindi olarak işaretle */
export function ackReadinessDimension(input = {}, actor = 'system') {
  const board = buildReadiness();
  let dim = (board.dimensions || []).find((d) => d.id === input.id || d.id === input.dimension_id);
  if (!dim) dim = (board.dimensions || []).find((d) => d.below_threshold);
  if (!dim) dim = (board.dimensions || [])[0];
  if (!dim) return { ok: false, error: 'Boyut yok' };
  const list = readCollection('readiness-acks', []) || [];
  const arr = Array.isArray(list) ? list : [];
  const row = {
    id: rid('rda'),
    dimension_id: dim.id,
    label: dim.label,
    score: dim.score,
    level: dim.level,
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    at: new Date().toISOString(),
    actor,
  };
  arr.unshift(row);
  writeCollection('readiness-acks', arr.slice(0, 200));
  appendAudit({
    actor,
    action: 'readiness.ack',
    detail: `${dim.label} · ${dim.score}`,
    meta: { id: row.id, dimension_id: dim.id },
  });
  return { ok: true, ack: row, dimension: dim, overview: buildReadiness() };
}

/** Eşik altı boyutu escalate → LİKYA-1 + gap kaydı */
export function escalateReadinessGap(input = {}, actor = 'system') {
  const board = buildReadiness();
  let dim = (board.dimensions || []).find((d) => d.id === input.id || d.id === input.dimension_id);
  if (!dim) {
    dim = (board.dimensions || [])
      .filter((d) => d.below_threshold || d.level === 'alert' || d.level === 'critical')
      .sort((a, b) => a.score - b.score)[0];
  }
  if (!dim) dim = (board.dimensions || []).slice().sort((a, b) => a.score - b.score)[0];
  if (!dim) return { ok: false, error: 'Escalate edilecek boyut yok' };
  const gap = {
    id: rid('rdg'),
    dimension_id: dim.id,
    label: dim.label,
    score: dim.score,
    level: dim.level,
    status: 'open',
    reason: String(input.reason || 'readiness gap').slice(0, 240),
    at: new Date().toISOString(),
    actor,
  };
  prependItem('readiness-gaps', gap, 200);
  enqueueAgentJob(
    {
      agent: 'LİKYA-1',
      title: `readiness gap · ${dim.label} · skor ${dim.score}`,
      priority: dim.level === 'critical' || dim.level === 'alert' ? 'high' : 'normal',
      payload: { gap_id: gap.id, dimension_id: dim.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'readiness.escalate',
    detail: `${dim.label} · ${dim.score}`,
    meta: { id: gap.id },
  });
  return { ok: true, gap, dimension: dim, overview: buildReadiness() };
}

/** Açık gap kapat */
export function resolveReadinessGap(input = {}, actor = 'system') {
  const list = readCollection('readiness-gaps', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Gap yok' };
  let idx = list.findIndex((g) => g.id === input.id && g.status === 'open');
  if (idx < 0) idx = list.findIndex((g) => g.dimension_id === input.dimension_id && g.status === 'open');
  if (idx < 0) idx = list.findIndex((g) => g.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık gap yok' };
  list[idx] = {
    ...list[idx],
    status: 'resolved',
    resolution: String(input.resolution || 'resolved').slice(0, 240),
    resolved_at: new Date().toISOString(),
    resolved_by: actor,
  };
  writeCollection('readiness-gaps', list);
  appendAudit({
    actor,
    action: 'readiness.gap_resolve',
    detail: list[idx].label,
    meta: { id: list[idx].id },
  });
  return { ok: true, gap: list[idx], overview: buildReadiness() };
}

export function runReadinessSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildReadiness();
  const existing = readCollection('readiness-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  const grade = o.grade || o.summary?.grade;
  if (force || grade === 'D' || grade === 'C' || (o.overall ?? 100) < 70) {
    candidates.push({
      key: 'score',
      level: grade === 'D' || (o.overall ?? 100) < 55 ? 'alert' : 'warn',
      text: `Hazırlık ${o.overall ?? 0}/${grade || '?'}`,
      domain: 'score',
    });
  }
  if (force || (o.summary?.dims_alert || 0) > 0 || (o.summary?.gaps_open || 0) > 0) {
    candidates.push({
      key: 'gaps',
      level: 'alert',
      text: `Alert boyut ${o.summary?.dims_alert || 0} · gap ${o.summary?.gaps_open || 0}`,
      domain: 'gaps',
    });
  }
  if (force || (o.summary?.dims_warn || 0) > 0) {
    candidates.push({
      key: 'warn',
      level: 'info',
      text: `Warn boyut ${o.summary?.dims_warn || 0}`,
      domain: 'dims',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Readiness heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('rdf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('readiness-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'LİKYA-1',
        title: `readiness sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('rdsweep'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('readiness-sweeps', sweep, 80);
  appendAudit({ actor, action: 'readiness.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildReadiness() };
}

export function ackReadinessFlag(input = {}, actor = 'system') {
  const list = readCollection('readiness-flags', []) || [];
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
  writeCollection('readiness-flags', list);
  appendAudit({ actor, action: 'readiness.flag_ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildReadiness() };
}
