/**
 * AŞAMA 34 — Tesis açılış/kapanış kontrol listeleri.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

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
  return {
    templates: ensureTemplates().length,
    openRuns: runs.filter((r) => r.status === 'in_progress').length,
    completedToday: runs.filter(
      (r) => r.status === 'completed' && r.completedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10),
    ).length,
  };
}
