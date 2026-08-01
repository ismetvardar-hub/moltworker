/**
 * AŞAMA 48 — SOCRATES nezaket / eğitim quiz.
 */

import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

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
  const avg = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
    : null;
  return {
    quizzes: listQuizzes(),
    attempts: attempts.slice(0, 20),
    attemptCount: attempts.length,
    avgScore: avg,
  };
}
