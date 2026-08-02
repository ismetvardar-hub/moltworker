/**
 * AŞAMA 48 — SOCRATES nezaket / eğitim quiz.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

function isIncomplete(a) {
  return a.status === 'incomplete' || a.status === 'started';
}

function hoursOld(iso) {
  const t = Date.parse(iso || 0);
  if (!Number.isFinite(t)) return 0;
  return (Date.now() - t) / 3600_000;
}

function ensureQuizzes() {
  let list = readCollection('training-quizzes', null);
  if (!Array.isArray(list) || list.length === 0) {
    list = [
      {
        id: 'quiz_ethos',
        title: 'ETHOS Centilmenlik Temelleri',
        questions: [
          {
            id: 'q1',
            prompt: 'Misafire ilk selam nasıl olmalı?',
            options: ['Göz teması + gülümseme', 'Sadece "buyurun"', 'Sessizce bekler'],
            answer: 0,
          },
          {
            id: 'q2',
            prompt: 'Şikayet geldiğinde ilk adım?',
            options: ['Savunmaya geç', 'Dinle ve teşekkür et', 'Yöneticiye bağırarak çağır'],
            answer: 1,
          },
          {
            id: 'q3',
            prompt: 'Master kural üçlüsü?',
            options: [
              'Hız, fiyat, satış',
              'Centilmenlik, naiflik, esprili üslup',
              'Sessizlik, mesafe, ciddiyet',
            ],
            answer: 1,
          },
        ],
      },
    ];
    writeCollection('training-quizzes', list);
  }
  return list;
}

export function listQuizzes() {
  return ensureQuizzes().map((q) => ({
    id: q.id,
    title: q.title,
    questionCount: (q.questions || []).length,
  }));
}

export function getQuiz(id) {
  return ensureQuizzes().find((q) => q.id === id) || null;
}

export function listAttempts(limit = 40) {
  return readCollection('training-attempts', []).slice(0, limit);
}

export function submitAttempt({ quizId, answers, person }, actor = 'system') {
  const quiz = getQuiz(quizId);
  if (!quiz) return null;
  const qs = quiz.questions || [];
  let correct = 0;
  const detail = qs.map((q, i) => {
    const chosen = Number(answers?.[q.id] ?? answers?.[i]);
    const ok = chosen === q.answer;
    if (ok) correct += 1;
    return { questionId: q.id, chosen, correct: q.answer, ok };
  });
  const score = qs.length ? Math.round((correct / qs.length) * 100) : 0;
  const attempt = {
    id: `att_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    quizId: quiz.id,
    quizTitle: quiz.title,
    person: person || actor,
    status: 'completed',
    score,
    correct,
    total: qs.length,
    detail,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('training-attempts', attempt, 300);
  appendAudit({
    actor,
    action: 'training.attempt',
    detail: `${attempt.person}: ${quiz.title} → %${score}`,
    meta: { id: attempt.id, score },
  });
  return attempt;
}

export function trainingSummary() {
  const attempts = listAttempts(50);
  const completed = attempts.filter((a) => Number.isFinite(Number(a.score)) && !isIncomplete(a));
  const avg = completed.length
    ? Math.round(completed.reduce((s, a) => s + Number(a.score || 0), 0) / completed.length)
    : null;
  const quizzes = listQuizzes();
  const attemptedQuizIds = new Set(completed.map((a) => a.quizId));
  const noAttemptQuizzes = quizzes.filter((q) => !attemptedQuizIds.has(q.id));
  const staleIncomplete = attempts.filter((a) => isIncomplete(a) && hoursOld(a.startedAt || a.at) >= 24);
  const flags = readCollection('training-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');
  return {
    title: 'LİKYA Eğitim Ops',
    quizzes,
    attempts: attempts.slice(0, 20),
    attemptCount: attempts.length,
    completedAttempts: completed.length,
    incompleteAttempts: attempts.filter(isIncomplete).length,
    noAttemptQuizzes: noAttemptQuizzes.length,
    staleIncomplete: staleIncomplete.length,
    avgScore: avg,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      attempt_count: attempts.length,
      completed_attempts: completed.length,
      incomplete_attempts: attempts.filter(isIncomplete).length,
      avg_score: avg,
      no_attempt_quizzes: noAttemptQuizzes.length,
      stale_incomplete: staleIncomplete.length,
    },
    summaryLines: [
      `Quiz ${quizzes.length} · tamamlanan ${completed.length} · ort skor ${avg ?? '—'}`,
      `Denemesiz quiz ${noAttemptQuizzes.length} · stale incomplete ${staleIncomplete.length} · training flag ${openFlags.length} açık`,
    ],
  };
}

export function runTrainingSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = trainingSummary();
  const threshold = Number(input.lowScoreThreshold) || 70;
  const existing = readCollection('training-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (overview.avgScore != null && overview.avgScore < threshold)) {
    candidates.push({
      key: 'training_low_avg_score',
      level: (overview.avgScore ?? 100) < 50 ? 'alert' : 'warn',
      text: `Ortalama eğitim skoru ${overview.avgScore ?? '—'} · eşik ${threshold}`,
      domain: 'scores',
    });
  }
  if (force || (overview.noAttemptQuizzes || 0) > 0) {
    candidates.push({
      key: 'training_quizzes_no_attempts',
      level: (overview.noAttemptQuizzes || 0) > 0 ? 'warn' : 'info',
      text: `Denemesiz quiz ${overview.noAttemptQuizzes || 0}`,
      domain: 'coverage',
    });
  }
  if (force || (overview.staleIncomplete || 0) > 0) {
    candidates.push({
      key: 'training_stale_incomplete',
      level: (overview.staleIncomplete || 0) > 0 ? 'warn' : 'info',
      text: `Stale incomplete quiz ${overview.staleIncomplete || 0}`,
      domain: 'completion',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'training_heartbeat', level: 'info', text: 'Training heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('trnf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('training-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'SOCRATES',
        title: `training sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('trns'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('training-sweeps', sweep, 80);
  appendAudit({ actor, action: 'training.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: trainingSummary() };
}

export function ackTrainingFlag(input = {}, actor = 'system') {
  const list = readCollection('training-flags', []) || [];
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
  writeCollection('training-flags', list);
  appendAudit({ actor, action: 'training.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: trainingSummary() };
}

/** Mutator 1 — start an in-progress quiz attempt for completion tracking. */
export function startTrainingAttempt(input = {}, actor = 'system') {
  const quiz = getQuiz(input.quizId) || ensureQuizzes()[0];
  if (!quiz) return { ok: false, error: 'Quiz yok' };
  const startedAt = input.stale
    ? new Date(Date.now() - (Number(input.hours) || 30) * 3600_000).toISOString()
    : new Date().toISOString();
  const attempt = {
    id: `att_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    quizId: quiz.id,
    quizTitle: quiz.title,
    person: input.person || actor,
    status: 'incomplete',
    correct: 0,
    total: (quiz.questions || []).length,
    detail: [],
    startedAt,
    at: startedAt,
    actor,
  };
  prependItem('training-attempts', attempt, 300);
  appendAudit({ actor, action: 'training.attempt_start', detail: `${attempt.person}: ${quiz.title}`, meta: { id: attempt.id } });
  return { ok: true, attempt, started: [attempt.id], overview: trainingSummary() };
}

/** Mutator 2 — complete an incomplete attempt, defaulting to passing answers. */
export function completeTrainingAttempt(input = {}, actor = 'system') {
  let list = readCollection('training-attempts', []) || [];
  if (!Array.isArray(list)) return { ok: false, error: 'Deneme listesi yok' };
  let idx = list.findIndex((a) => a.id === input.id && isIncomplete(a));
  if (idx < 0) idx = list.findIndex(isIncomplete);
  if (idx < 0) {
    const seeded = startTrainingAttempt({ quizId: input.quizId, person: input.person }, actor);
    list = readCollection('training-attempts', []) || [];
    idx = list.findIndex((a) => a.id === seeded.attempt?.id);
    if (idx < 0) return { ok: false, error: 'Incomplete deneme yok' };
  }
  const row = list[idx];
  const quiz = getQuiz(row.quizId);
  if (!quiz) return { ok: false, error: 'Quiz bulunamadı' };
  const answers = input.answers || Object.fromEntries((quiz.questions || []).map((q) => [q.id, q.answer]));
  let correct = 0;
  const detail = (quiz.questions || []).map((q, i) => {
    const chosen = Number(answers?.[q.id] ?? answers?.[i]);
    const ok = chosen === q.answer;
    if (ok) correct += 1;
    return { questionId: q.id, chosen, correct: q.answer, ok };
  });
  const score = detail.length ? Math.round((correct / detail.length) * 100) : 0;
  list[idx] = {
    ...row,
    status: 'completed',
    score,
    correct,
    total: detail.length,
    detail,
    completedAt: new Date().toISOString(),
    at: new Date().toISOString(),
    completedBy: actor,
  };
  writeCollection('training-attempts', list);
  appendAudit({ actor, action: 'training.attempt_complete', detail: `${row.person}: %${score}`, meta: { id: row.id, score } });
  return { ok: true, attempt: list[idx], completed: [row.id], overview: trainingSummary() };
}

/** Mutator 3 — seed a low-score completed attempt for coaching drills. */
export function seedLowScoreTrainingAttempt(input = {}, actor = 'system') {
  const quiz = getQuiz(input.quizId) || ensureQuizzes()[0];
  if (!quiz) return { ok: false, error: 'Quiz yok' };
  const answers = Object.fromEntries(
    (quiz.questions || []).map((q) => [q.id, Number(q.answer) === 0 ? 1 : 0]),
  );
  const attempt = submitAttempt({ quizId: quiz.id, answers, person: input.person || 'Training Seed' }, actor);
  appendAudit({ actor, action: 'training.low_score_seed', detail: `${attempt?.quizTitle} → %${attempt?.score}`, meta: { id: attempt?.id } });
  return { ok: true, attempt, seeded: attempt ? [attempt.id] : [], overview: trainingSummary() };
}
