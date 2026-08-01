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
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.runAgentQueueSlaSweep({ force: true }).then((r: any) => {
                    ping(`SLA esc ${r.escalated?.length ?? 0} · dead ${r.dead?.length ?? 0}`)
                    return refresh()
                  })
                }
              >
                SLA sweep
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100"
                onClick={() =>
                  void api.rebalanceAgentQueue({}).then((r: any) => {
                    ping(
                      `Rebalance boost ${r.run?.boosted ?? 0} · demote ${r.run?.demoted ?? 0} · dedupe ${r.run?.deduped ?? 0}`,
                    )
                    return refresh()
                  })
                }
              >
                Rebalance
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100"
                onClick={() =>
                  void api.reviveDeadAgentJobs({ limit: 10 }).then((r: any) => {
                    ping(r.ok ? `Revive ${r.revived?.length ?? 0}` : r.error || 'Revive yok')
                    return refresh()
                  })
                }
              >
                Dead revive
              </button>
              <button
                type="button"
                className="rounded-lg bg-obsidian-800 px-3 py-2 text-sm"
                onClick={() =>
                  void api.archiveAgentJobs({ force: true }).then((r: any) => {
                    ping(r.ok ? `Arşiv ${r.run?.archived ?? 0}` : r.error || 'Arşiv yok')
                    return refresh()
                  })
                }
              >
                Arşivle
              </button>
              <button
                type="button"
                className="rounded-lg bg-violet-500/20 px-3 py-2 text-sm text-violet-100"
                onClick={() =>
                  void api.wakeSnoozedAgentJobs({ force: true }).then((r: any) => {
                    ping(`Wake ${r.woken?.length ?? 0}`)
                    return refresh()
                  })
                }
              >
                Snooze wake
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              SLA ihlal {data.summary?.sla_breach ?? 0} · dead-letter {data.summary?.dead_letter ?? 0} · high{' '}
              {data.summary?.high_priority ?? 0} · snooze {data.summary?.snoozed ?? 0} · iptal{' '}
              {data.summary?.cancelled ?? 0} · arşiv {data.summary?.archived ?? 0}
            </p>
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
                      <span className="flex flex-wrap gap-1">
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
                        <button
                          type="button"
                          className="rounded-md bg-amber-500/20 px-2 py-1 text-[10px] text-amber-100"
                          onClick={() =>
                            void api.bumpAgentJobPriority({ id: j.id, reason: 'ops bump' }).then((r: any) => {
                              ping(r.ok ? `Bump → ${r.job?.priority}` : r.error || 'Bump yok')
                              return refresh()
                            })
                          }
                        >
                          Bump
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-sky-500/20 px-2 py-1 text-[10px] text-sky-100"
                          onClick={() =>
                            void api.snoozeAgentJob({ id: j.id, minutes: 15 }).then((r: any) => {
                              ping(r.ok ? 'Snooze' : r.error || 'Snooze yok')
                              return refresh()
                            })
                          }
                        >
                          Snooze
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-rose-500/20 px-2 py-1 text-[10px] text-rose-100"
                          onClick={() =>
                            void api.cancelAgentJob({ id: j.id, reason: 'ops cancel' }).then((r: any) => {
                              ping(r.ok ? 'İptal' : r.error || 'İptal yok')
                              return refresh()
                            })
                          }
                        >
                          İptal
                        </button>
                      </span>
                    )}
                    {j.status === 'snoozed' && (
                      <button
                        type="button"
                        className="rounded-md bg-violet-500/20 px-2 py-1 text-[10px] text-violet-100"
                        onClick={() =>
                          void api.wakeSnoozedAgentJobs({ force: true }).then((r: any) => {
                            ping(`Wake ${r.woken?.length ?? 0}`)
                            return refresh()
                          })
                        }
                      >
                        Wake
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
