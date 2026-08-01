import { useEffect, useState } from 'react';
import { KeyRound, Mountain } from 'lucide-react';
import { fetchDemoUsers, login, type DemoUser } from '../services/auth';

interface LoginPageProps {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('ceo');
  const [password, setPassword] = useState('likya2026');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demos, setDemos] = useState<DemoUser[]>([]);

  useEffect(() => {
    void fetchDemoUsers().then(setDemos);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-obsidian-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="glow-pulse mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-lykia-500/15 text-lykia-400">
            <Mountain className="size-7" />
          </div>
          <h1 className="text-xl font-bold tracking-wide text-lykia-300">OLYMPOSPASS</h1>
          <p className="mt-1 text-sm text-slate-400">LİKYA Holding · Rol tabanlı giriş</p>
        </div>

        <form
          onSubmit={(e) => void submit(e)}
          className="rounded-2xl border border-obsidian-700 bg-obsidian-900 p-6 shadow-xl"
        >
          <label className="block">
            <span className="text-xs font-medium text-slate-400">Kullanıcı</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-4 py-2.5 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
              autoComplete="username"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-xs font-medium text-slate-400">Şifre</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-4 py-2.5 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950 transition hover:bg-lykia-400 disabled:opacity-50"
          >
            <KeyRound className="size-4" />
            {loading ? 'Giriş yapılıyor…' : 'Panele Gir'}
          </button>
        </form>

        {demos.length > 0 && (
          <div className="mt-4 rounded-2xl border border-obsidian-700 bg-obsidian-900/60 p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Demo hesaplar
            </p>
            <ul className="space-y-2">
              {demos.map((d) => (
                <li key={d.username}>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername(d.username);
                      if (d.hint) setPassword(d.hint);
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2 text-left text-xs transition hover:border-lykia-500/40"
                  >
                    <span>
                      <span className="font-semibold text-slate-200">{d.name}</span>
                      <span className="ml-2 font-mono text-slate-500">
                        {d.username}
                        {d.hint ? ` / ${d.hint}` : ''}
                      </span>
                    </span>
                    <span className="rounded-full bg-lykia-500/10 px-2 py-0.5 font-mono text-[10px] text-lykia-300">
                      {d.role}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
