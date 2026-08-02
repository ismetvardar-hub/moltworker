/**
 * AŞAMA 34 — Tesis açılış/kapanış kontrol listeleri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl_open_beach',
    name: 'Sahil açılış',
    venueId: 'venue_olympos_beach',
    kind: 'opening',
    items: [
      'Turnike güç kontrolü',
      'NEXUS heartbeat',
      'Menü panosu güncel mi',
      'İlk stok sayımı',
      'ETHOS brifing (centilmenlik hatırlatması)',
    ],
  },
  {
    id: 'tpl_close_kaleici',
    name: 'Kaleiçi kapanış',
    venueId: 'venue_kaleici',
    kind: 'closing',
    items: [
      'Mutfak gaz/elektrik kapat',
      'Kasa sayımı',
      'Kapı kilitleri',
      'Soğuk zincir sıcaklık kaydı',
      'Gece vardiyası teslim',
    ],
  },
];

function ensureTemplates() {
  let list = readCollection('checklist-templates', null);
  if (!Array.isArray(list) || list.length === 0) {
    writeCollection('checklist-templates', DEFAULT_TEMPLATES);
    return DEFAULT_TEMPLATES;
  }
  return list;
}

function ensureRuns() {
  const list = readCollection('checklist-runs', null);
  if (!Array.isArray(list)) {
    writeCollection('checklist-runs', []);
    return [];
  }
  return list;
}

export function listChecklistTemplates() {
  return ensureTemplates();
}

export function listChecklistRuns(filter = {}) {
  let list = ensureRuns();
  if (filter.venueId) list = list.filter((r) => r.venueId === filter.venueId);
  if (filter.status) list = list.filter((r) => r.status === filter.status);
  return list.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
}

export function startChecklistRun(templateId, actor = 'system') {
  const tpl = ensureTemplates().find((t) => t.id === templateId);
  if (!tpl) return null;
  const run = {
    id: `run_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    templateId: tpl.id,
    name: tpl.name,
    kind: tpl.kind,
    venueId: tpl.venueId,
    status: 'in_progress',
    checks: tpl.items.map((label, i) => ({
      id: `chk_${i}`,
      label,
      done: false,
      at: null,
    })),
    startedAt: new Date().toISOString(),
    startedBy: actor,
    completedAt: null,
  };
  prependItem('checklist-runs', run, 200);
  appendAudit({
    actor,
    action: 'checklist.start',
    detail: run.name,
    meta: { id: run.id, templateId },
  });
  return run;
}

export function toggleChecklistItem(runId, checkId, done, actor = 'system') {
  const list = ensureRuns();
  const idx = list.findIndex((r) => r.id === runId);
  if (idx < 0) return null;
  const run = { ...list[idx] };
  run.checks = (run.checks || []).map((c) =>
    c.id === checkId
      ? { ...c, done: done ?? !c.done, at: new Date().toISOString(), by: actor }
      : c,
  );
  const allDone = run.checks.every((c) => c.done);
  if (allDone) {
    run.status = 'completed';
    run.completedAt = new Date().toISOString();
  } else {
    run.status = 'in_progress';
    run.completedAt = null;
  }
  list[idx] = run;
  writeCollection('checklist-runs', list);
  appendAudit({
    actor,
    action: 'checklist.toggle',
    detail: `${run.name} · ${checkId} → ${allDone ? 'tamam' : 'devam'}`,
    meta: { runId, checkId },
  });
  return run;
}

export function checklistsSummary() {
  const runs = listChecklistRuns();
  const openRuns = runs.filter((r) => r.status === 'in_progress').length;
  const failed = runs.filter((r) => r.status === 'failed').length;
  const completedToday = runs.filter(
    (r) => r.status === 'completed' && r.completedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10),
  ).length;
  const templates = ensureTemplates().length;
  const flags = readCollection('checklists-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    templates,
    openRuns,
    failed,
    completedToday,
    title: 'LİKYA Checklist',
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      open_runs: openRuns,
      failed,
      completed_today: completedToday,
      templates,
    },
    summaryLines: [
      `Şablon ${templates} · açık run ${openRuns} · bugün tamam ${completedToday}`,
      `Checklists flag ${openFlags.length} açık`,
    ],
  };
}

export function runChecklistsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = checklistsSummary();
  const existing = readCollection('checklists-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.openRuns || 0) > 0) {
    candidates.push({
      key: 'open',
      level: 'warn',
      text: `Açık checklist run ${o.openRuns || 0}`,
      domain: 'open',
    });
  }
  if (force || (o.failed || 0) > 0) {
    candidates.push({
      key: 'failed',
      level: 'alert',
      text: `Başarısız run ${o.failed || 0}`,
      domain: 'failed',
    });
  }
  if (force || (o.templates || 0) > 0) {
    candidates.push({
      key: 'templates',
      level: 'info',
      text: `Şablon ${o.templates || 0}`,
      domain: 'templates',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Checklists heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('chkf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('checklists-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `checklists sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('chks'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('checklists-sweeps', sweep, 80);
  appendAudit({ actor, action: 'checklists.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: checklistsSummary() };
}

export function ackChecklistsFlag(input = {}, actor = 'system') {
  const list = readCollection('checklists-flags', []) || [];
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
  writeCollection('checklists-flags', list);
  appendAudit({ actor, action: 'checklists.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: checklistsSummary() };
}

/** Mutator 1 — start run from template seed. */
export function startChecklistOpsRun(input = {}, actor = 'system') {
  const templates = ensureTemplates();
  let tpl = null;
  if (input.templateId) tpl = templates.find((t) => t.id === input.templateId);
  if (!tpl && input.kind) tpl = templates.find((t) => t.kind === input.kind);
  if (!tpl) tpl = templates[0];
  if (!tpl) return { ok: false, error: 'Şablon yok' };
  const run = startChecklistRun(tpl.id, actor);
  if (!run) return { ok: false, error: 'Run başlatılamadı' };
  appendAudit({ actor, action: 'checklists.ops_start', detail: run.name, meta: { id: run.id } });
  return { ok: true, run, started: [run.id], overview: checklistsSummary() };
}

/** Mutator 2 — complete run (mark all checks done). */
export function completeChecklistOpsRun(input = {}, actor = 'system') {
  let runs = listChecklistRuns().filter((r) => r.status === 'in_progress');
  if (input.id) runs = runs.filter((r) => r.id === input.id);
  const completed = [];
  for (const run of runs.slice(0, Number(input.limit) || 20)) {
    let current = run;
    for (const c of run.checks || []) {
      if (!c.done) {
        current = toggleChecklistItem(run.id, c.id, true, actor) || current;
      }
    }
    if (current?.status === 'completed') completed.push(current.id);
    else {
      const list = ensureRuns();
      const idx = list.findIndex((r) => r.id === run.id);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          status: 'completed',
          completedAt: new Date().toISOString(),
          checks: (list[idx].checks || []).map((c) => ({
            ...c,
            done: true,
            at: c.at || new Date().toISOString(),
            by: actor,
          })),
        };
        writeCollection('checklist-runs', list);
        completed.push(list[idx].id);
      }
    }
  }
  if (!completed.length) {
    const started = startChecklistOpsRun(input, actor);
    if (started.run) {
      const list = ensureRuns();
      const idx = list.findIndex((r) => r.id === started.run.id);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          status: 'completed',
          completedAt: new Date().toISOString(),
          checks: (list[idx].checks || []).map((c) => ({
            ...c,
            done: true,
            at: c.at || new Date().toISOString(),
            by: actor,
          })),
        };
        writeCollection('checklist-runs', list);
        completed.push(list[idx].id);
      }
    }
  }
  appendAudit({ actor, action: 'checklists.ops_complete', detail: `${completed.length}`, meta: { n: completed.length } });
  return { ok: true, completed, overview: checklistsSummary() };
}

/** Mutator 3 — fail / reset item (or run). */
export function failResetChecklistItem(input = {}, actor = 'system') {
  let run = null;
  const runs = listChecklistRuns();
  if (input.runId) run = runs.find((r) => r.id === input.runId);
  if (!run) run = runs.find((r) => r.status === 'in_progress') || runs[0];
  if (!run) {
    const started = startChecklistOpsRun({}, actor);
    run = started.run;
  }
  if (!run) return { ok: false, error: 'Run yok' };

  const list = ensureRuns();
  const idx = list.findIndex((r) => r.id === run.id);
  if (idx < 0) return { ok: false, error: 'Run bulunamadı' };

  const reset = !!input.reset;
  let checkId = input.checkId;
  if (!checkId) {
    const target = (list[idx].checks || []).find((c) => (reset ? c.done : !c.done))
      || (list[idx].checks || [])[0];
    checkId = target?.id;
  }

  if (reset && checkId) {
    list[idx] = {
      ...list[idx],
      status: 'in_progress',
      completedAt: null,
      checks: (list[idx].checks || []).map((c) =>
        c.id === checkId
          ? { ...c, done: false, failed: false, at: new Date().toISOString(), by: actor }
          : c,
      ),
    };
  } else if (checkId) {
    list[idx] = {
      ...list[idx],
      status: 'failed',
      checks: (list[idx].checks || []).map((c) =>
        c.id === checkId
          ? {
              ...c,
              done: false,
              failed: true,
              failNote: String(input.note || 'failed').slice(0, 240),
              at: new Date().toISOString(),
              by: actor,
            }
          : c,
      ),
    };
  } else {
    list[idx] = { ...list[idx], status: 'failed' };
  }

  writeCollection('checklist-runs', list);
  appendAudit({
    actor,
    action: reset ? 'checklists.item_reset' : 'checklists.item_fail',
    detail: `${list[idx].name} · ${checkId || 'run'}`,
    meta: { runId: list[idx].id, checkId, reset },
  });
  return {
    ok: true,
    run: list[idx],
    failed: reset ? [] : [list[idx].id],
    reset: reset ? [list[idx].id] : [],
    overview: checklistsSummary(),
  };
}
