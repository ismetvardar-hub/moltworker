import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import {
  ackTrainingFlag,
  completeTrainingAttempt,
  fetchQuiz,
  fetchTraining,
  runTrainingSweep,
  seedLowScoreTrainingAttempt,
  startTrainingAttempt,
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
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [lastScore, setLastScore] = useState<number | null>(null)

  async function refresh() {
    try {
      const data = await fetchTraining()
      setQuizzes(data.quizzes)
      setAttempts(data.attempts)
      setAvgScore(data.avgScore)
      setOverview(data)
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
      setLastScore(res.attempt.score ?? null)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gönderilemedi')
    }
  }

  function ping(message: string) {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2800)
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
      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}
      <PanelCard title={overview?.title || 'Eğitim ops'}>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {(overview?.summaryLines || []).map((line: string) => <li key={line}>{line}</li>)}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950" onClick={() => void runTrainingSweep({ force: true }).then((r: any) => { ping(`Sweep +${r.created?.length ?? 0}`); return refresh() })}>Sweep</button>
          <button type="button" className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100" onClick={() => void startTrainingAttempt({ stale: true }).then((r: any) => { ping(`Started ${r.started?.length ?? 0}`); return refresh() })}>Start stale</button>
          <button type="button" className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100" onClick={() => void completeTrainingAttempt({}).then((r: any) => { ping(`Completed ${r.completed?.length ?? 0}`); return refresh() })}>Complete</button>
          <button type="button" className="rounded-lg bg-rose-500/20 px-3 py-2 text-sm text-rose-100" onClick={() => void seedLowScoreTrainingAttempt({}).then((r: any) => { ping(`Low seed ${r.seeded?.length ?? 0}`); return refresh() })}>Seed low score</button>
          <button type="button" className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm" onClick={() => void ackTrainingFlag({}).then((r: any) => { ping(r.ok ? 'Flag ack' : r.error || 'Ack yok'); return refresh() })}>Flag ack</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Flag {(overview?.summary as any)?.flags_open ?? 0} · denemesiz {overview?.noAttemptQuizzes ?? 0} · stale {overview?.staleIncomplete ?? 0}
        </p>
      </PanelCard>
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
              {a.person} · {a.quizTitle} · {a.status === 'incomplete' ? 'incomplete' : `%${a.score}`} ({a.correct ?? 0}/{a.total ?? 0})
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  )
}
