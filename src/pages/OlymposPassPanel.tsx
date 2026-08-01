import { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  BadgeX,
  DoorOpen,
  RefreshCw,
  ScanLine,
  Ticket,
  Users,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import { sendNexusCommand } from '../services/nexus';
import {
  admitPass,
  fetchAccessEvents,
  fetchPassGates,
  fetchPassHolders,
  type AccessEventDto,
  type PassDecision,
  type PassGate,
  type PassHolderDto,
} from '../services/pass';
import type { PassTier } from '../types';

const TIER_STYLE: Record<string, string> = {
  Platin: 'bg-violet-500/15 text-violet-300',
  Altın: 'bg-lykia-500/15 text-lykia-300',
  Gümüş: 'bg-slate-400/15 text-slate-300',
  Standart: 'bg-sky-500/15 text-sky-300',
};

export default function OlymposPassPanel() {
  const [code, setCode] = useState('OLP-7A21');
  const [gateId, setGateId] = useState('');
  const [gates, setGates] = useState<PassGate[]>([]);
  const [holders, setHolders] = useState<PassHolderDto[]>([]);
  const [events, setEvents] = useState<AccessEventDto[]>([]);
  const [decision, setDecision] = useState<PassDecision | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nexusNote, setNexusNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [h, g, e] = await Promise.all([
        fetchPassHolders(),
        fetchPassGates(),
        fetchAccessEvents(30),
      ]);
      setHolders(h.holders);
      setGates(g);
      setEvents(e);
      if (!gateId && g[0]) setGateId(g[0].id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pass verisi alınamadı');
    }
  }, [gateId]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const runAdmit = async () => {
    if (!gateId || !code.trim()) return;
    setBusy(true);
    setNexusNote(null);
    try {
      const { decision: d, event } = await admitPass(code.trim(), gateId);
      setDecision(d);
      if (d.allowed && event.nexusDeviceId) {
        try {
          await sendNexusCommand({
            deviceId: event.nexusDeviceId,
            action: 'pulse',
            passCode: d.code,
          });
          setNexusNote(`NEXUS pulse → ${event.nexusDeviceId}`);
        } catch {
          setNexusNote('Geçiş kaydı OK · NEXUS pulse atlanamadı/başarısız');
        }
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geçiş başarısız');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <Ticket className="size-6 text-lykia-400" />
            OlymposPass Geçiş Motoru
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kart/QR doğrulama · tesis/kapı yetkisi · NEXUS pulse (AŞAMA 13)
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-4 py-2.5 text-sm font-semibold text-slate-200"
        >
          <RefreshCw className="size-4" />
          Yenile
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PanelCard
          title="Kapıda Okut"
          subtitle="Kod + kapı → doğrula & geçir"
          className="xl:col-span-1"
        >
          <label className="block">
            <span className="text-xs text-slate-400">Kapı / Tesis</span>
            <select
              value={gateId}
              onChange={(e) => setGateId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2.5 text-sm text-slate-100 focus:border-lykia-500 focus:outline-none"
            >
              {gates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} · {g.venueName}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block">
            <span className="text-xs text-slate-400">Kart / QR kodu</span>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setDecision(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runAdmit();
              }}
              placeholder="OLP-7A21"
              className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-4 py-3 font-mono text-lg uppercase text-lykia-300 focus:border-lykia-500 focus:outline-none"
            />
          </label>
          <button
            type="button"
            disabled={busy || !gateId}
            onClick={() => void runAdmit()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lykia-500 px-4 py-3 text-sm font-semibold text-obsidian-950 hover:bg-lykia-400 disabled:opacity-50"
          >
            <ScanLine className="size-4" />
            {busy ? 'İşleniyor…' : 'Doğrula & Geçir'}
          </button>

          {decision && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 ${
                decision.allowed
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-rose-500/30 bg-rose-500/10'
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                {decision.allowed ? (
                  <BadgeCheck className="size-4 text-emerald-300" />
                ) : (
                  <BadgeX className="size-4 text-rose-300" />
                )}
                <span className={decision.allowed ? 'text-emerald-200' : 'text-rose-200'}>
                  {decision.reason}
                </span>
              </p>
              {decision.holder && (
                <p className="mt-1 text-xs text-slate-400">
                  {decision.holder.name} · {decision.holder.tier}
                </p>
              )}
              {nexusNote && (
                <p className="mt-2 font-mono text-[11px] text-sky-300">{nexusNote}</p>
              )}
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="Kart Sahipleri"
          subtitle={`${holders.filter((h) => h.active).length} aktif`}
          className="xl:col-span-2"
        >
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {holders.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <Users className="size-3.5 text-slate-500" />
                      {h.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-lykia-300">{h.id}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {(h.zones ?? []).join(' · ')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      TIER_STYLE[h.tier as PassTier] ?? TIER_STYLE.Standart
                    }`}
                  >
                    {h.tier}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-600">
                  {h.active ? 'Aktif' : 'Pasif'}
                  {h.lastEntryAt
                    ? ` · son ${new Date(h.lastEntryAt).toLocaleString('tr-TR')}`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>

      <PanelCard title="Canlı Geçiş Akışı" subtitle="Sunucu access-events">
        <ul className="max-h-80 space-y-2 overflow-y-auto font-mono text-xs">
          {events.length === 0 && (
            <li className="font-sans text-sm text-slate-600">
              Henüz geçiş yok — bir kod okutun.
            </li>
          )}
          {events.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2"
            >
              <span>
                <span className="text-slate-600">
                  {new Date(e.at).toLocaleTimeString('tr-TR')}
                </span>{' '}
                <span className="text-lykia-300">{e.code}</span>{' '}
                <span className="text-slate-300">{e.holderName}</span>{' '}
                <span className="text-sky-300">@ {e.gateName}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  e.allowed
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                <DoorOpen className="size-3" />
                {e.allowed ? 'izin' : 'red'}
              </span>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
