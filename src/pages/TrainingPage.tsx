import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  fetchQuiz,
  fetchTraining,
  submitTrainingAttempt,
  type Attempt,
  type QuizQuestion,
  type QuizSummary,
} from '../services/training'

export default function TrainingPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [avgScore, setAvgScore] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [title, setTitle] = useState('')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [lastScore, setLastScore] = useState<number | null>(null)

  async function refresh() {
    try {
      const data = await fetchTraining()
      setQuizzes(data.quizzes)
      setAttempts(data.attempts)
      setAvgScore(data.avgScore)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eğitim alınamadı')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function openQuiz(id: string) {
    try {
      const data = await fetchQuiz(id)
      setActiveId(id)
      setTitle(data.quiz.title)
      setQuestions(data.quiz.questions)
      setAnswers({})
      setLastScore(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Quiz açılamadı')
    }
  }

  async function submit() {
    if (!activeId) return
    try {
      const res = await submitTrainingAttempt({ quizId: activeId, answers })
      setLastScore(res.attempt.score)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gönderilemedi')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Eğitim / SOCRATES</h1>
        <p className="mt-1 text-sm text-slate-400">
          Ortalama skor {avgScore ?? '—'} · {attempts.length} deneme
        </p>
      </header>
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      <PanelCard title="Quizler">
        <ul className="space-y-2">
          {quizzes.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between rounded-lg border border-obsidian-700 px-3 py-2 text-sm"
            >
              <span className="text-slate-100">
                {q.title} · {q.questionCount} soru
              </span>
              <button
                type="button"
                onClick={() => void openQuiz(q.id)}
                className="rounded-md bg-lykia-500/90 px-2 py-1 text-xs font-medium text-obsidian-950"
              >
                Başla
              </button>
            </li>
          ))}
        </ul>
      </PanelCard>
      {activeId && (
        <PanelCard title={title}>
          <ul className="space-y-4">
            {questions.map((q) => (
              <li key={q.id}>
                <div className="text-sm font-medium text-slate-100">{q.prompt}</div>
                <div className="mt-2 space-y-1">
                  {q.options.map((opt, i) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === i}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void submit()}
            className="mt-4 rounded-lg bg-emerald-600/90 px-3 py-2 text-sm text-white"
          >
            Gönder
          </button>
          {lastScore !== null && (
            <p className="mt-2 text-sm text-lykia-300">Son skor: %{lastScore}</p>
          )}
        </PanelCard>
      )}
      <PanelCard title="Son denemeler">
        <ul className="space-y-2 text-sm text-slate-400">
          {attempts.map((a) => (
            <li key={a.id} className="rounded-lg border border-obsidian-700 px-3 py-2">
              {a.person} · {a.quizTitle} · %{a.score} ({a.correct}/{a.total})
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
