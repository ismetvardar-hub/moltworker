import { useEffect, useState } from 'react'
import PanelCard from '../components/PanelCard'
import * as api from '../services/agentqueue'

export default function AgentqueuePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  async function refresh() {
    try {
      setData(await api.fetchAgentQueue())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi')
    }
  }
  useEffect(() => {
    void refresh()
  }, [])
  function ping(m: string) {
    setFlash(m)
    window.setTimeout(() => setFlash(null), 2800)
  }
  return (
    <div className="space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lykia-400/80">LİKYA Kampüs</p>
        <h1 className="text-2xl font-bold tracking-tight text-lykia-200">Ajan İş Kuyruğu</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">Enqueue · claim · complete — komuta talimat hattı.</p>
      </header>
      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>
      )}
      {flash && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {flash}
        </p>
      )}
      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard title="Özet">
            <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div>
                <dt className="text-xs text-slate-500">Queued</dt>
                <dd className="text-lg text-lykia-200">{data.summary?.queued}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Running</dt>
                <dd className="text-lg">{data.summary?.running}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Done</dt>
                <dd>{data.summary?.done}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Failed</dt>
                <dd>{data.summary?.failed}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-lykia-500/90 px-3 py-2 text-sm text-obsidian-950"
                onClick={() =>
                  void api
                    .enqueueAgentJob({
                      agent: 'DAZE-HUB',
                      title: 'Sabah brifing paketi',
                      priority: 'high',
                    })
                    .then(() => {
                      ping('İş kuyruğa girdi')
                      return refresh()
                    })
                }
              >
                Talimat ekle
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.claimAgentJob({}).then(() => {
                    ping('Claim')
                    return refresh()
                  })
                }
              >
                Claim
              </button>
            </div>
          </PanelCard>
          <PanelCard title="İşler">
            <ul className="space-y-2 text-sm">
              {(data.jobs || []).slice(0, 12).map((j: any) => (
                <li key={j.id} className="rounded-lg border border-obsidian-700 px-3 py-2 text-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="text-lykia-300">{j.agent}</span> · {j.title}
                      <span className="ml-2 text-xs text-slate-500">{j.status}</span>
                    </span>
                    {j.status === 'running' && (
                      <button
                        type="button"
                        className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]"
                        onClick={() =>
                          void api.completeAgentJob({ id: j.id }).then(() => {
                            ping('Tamamlandı')
                            return refresh()
                          })
                        }
                      >
                        Complete
                      </button>
                    )}
                    {j.status === 'queued' && (
                      <button
                        type="button"
                        className="rounded-md bg-obsidian-800 px-2 py-1 text-[10px]"
                        onClick={() =>
                          void api.claimAgentJob({ id: j.id }).then(() => {
                            ping('Claimed')
                            return refresh()
                          })
                        }
                      >
                        Claim
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      )}
    </div>
  )
}
