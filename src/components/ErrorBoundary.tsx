import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  onReset?: () => void
}

type State = {
  error: Error | null
}

/** Lazy modül / render çöküşlerinde boş ekran yerine kurtarma */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[LİKYA] sayfa hatası', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-40 flex-col items-start justify-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 px-5 py-6">
        <p className="text-sm font-semibold text-rose-200">Bu modül yüklenirken takıldı.</p>
        <p className="max-w-xl text-xs text-slate-400">
          {this.state.error.message || 'Bilinmeyen hata'} — menüden başka bir sekmeye geçebilir veya
          yeniden deneyebilirsin.
        </p>
        <button
          type="button"
          onClick={() => {
            this.setState({ error: null })
            this.props.onReset?.()
          }}
          className="rounded-xl border border-obsidian-600 bg-obsidian-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-lykia-500/50 hover:text-lykia-300"
        >
          Yeniden dene
        </button>
      </div>
    )
  }
}
