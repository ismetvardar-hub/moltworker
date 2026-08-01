import { useCallback, useEffect, useState } from 'react';
import {
  Cpu,
  DoorOpen,
  Lock,
  Radio,
  RefreshCw,
  ScanLine,
  Unlock,
  Zap,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import {
  fetchNexusDevices,
  fetchNexusEvents,
  sendNexusCommand,
  type NexusAction,
  type NexusDevice,
  type NexusEvent,
} from '../services/nexus';
import { fetchVenues, type Venue } from '../services/venues';

const ACTIONS: { action: NexusAction; label: string; icon: typeof Lock }[] = [
  { action: 'unlock', label: 'Aç', icon: Unlock },
  { action: 'lock', label: 'Kilitle', icon: Lock },
  { action: 'pulse', label: '3 sn Pulse', icon: Zap },
  { action: 'scan', label: 'RFID Tara', icon: ScanLine },
  { action: 'status', label: 'Durum', icon: Radio },
];

export default function NexusPanel() {
  const [devices, setDevices] = useState<NexusDevice[]>([]);
  const [events, setEvents] = useState<NexusEvent[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueFilter, setVenueFilter] = useState('');
  const [mode, setMode] = useState('simulation');
  const [protocol, setProtocol] = useState('likya-nexus-v1');
  const [passCode, setPassCode] = useState('OLP-7A21');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [d, e, v] = await Promise.all([
        fetchNexusDevices(venueFilter || undefined),
        fetchNexusEvents(),
        fetchVenues().catch(() => ({ venues: [] as Venue[] })),
      ]);
      setDevices(d.devices);
      setMode(d.mode);
      setProtocol(d.protocol);
      setEvents(e);
      setVenues(v.venues);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NEXUS erişilemedi');
    }
  }, [venueFilter]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 4000);
    return () => clearInterval(timer);
  }, [refresh]);

  const run = async (deviceId: string, action: NexusAction) => {
    setBusyId(`${deviceId}:${action}`);
    try {
      await sendNexusCommand({
        deviceId,
        action,
        passCode: action === 'unlock' || action === 'pulse' || action === 'scan' ? passCode : undefined,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Komut başarısız');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
            <Cpu className="size-6 text-lykia-400" />
            NEXUS — IoT &amp; Donanım Komuta
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Turnike, RFID ve kapı röle protokolü · {protocol} · mod:{' '}
            <span className="font-mono text-lykia-300">{mode}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-xl border border-obsidian-700 bg-obsidian-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-lykia-500/40 hover:text-lykia-300"
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PanelCard
          title="Geçiş Kodu"
          subtitle="unlock / pulse / scan komutlarına eklenir (OlymposPass)"
        >
          <input
            value={passCode}
            onChange={(e) => setPassCode(e.target.value.toUpperCase())}
            className="w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-4 py-2.5 font-mono text-sm uppercase text-lykia-300 focus:border-lykia-500 focus:outline-none"
            placeholder="OLP-XXXX"
          />
        </PanelCard>
        <PanelCard title="Tesis Filtresi" subtitle="AŞAMA 10 — cihazları locasyona göre süz">
          <select
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-4 py-2.5 text-sm text-slate-200 focus:border-lykia-500 focus:outline-none"
          >
            <option value="">Tüm tesisler</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </PanelCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {devices.map((d) => (
          <PanelCard
            key={d.id}
            title={d.name}
            subtitle={`${d.type} · ${d.protocol} · ${d.host} · ${d.firmware}${d.venueId ? ` · ${d.venueId}` : ''}`}
            actions={
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  d.online ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                {d.online ? 'Çevrimiçi' : 'Çevrimdışı'} · {d.state}
              </span>
            }
          >
            <div className="flex flex-wrap gap-2">
              {ACTIONS.filter((a) =>
                d.type === 'display' ? a.action === 'status' : true,
              ).map(({ action, label, icon: Icon }) => (
                <button
                  key={action}
                  type="button"
                  disabled={!d.online || busyId === `${d.id}:${action}`}
                  onClick={() => void run(d.id, action)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-obsidian-700 bg-obsidian-950 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-lykia-500/40 hover:text-lykia-300 disabled:opacity-40"
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </PanelCard>
        ))}
      </div>

      <PanelCard
        title="NEXUS Olay Günlüğü"
        subtitle="Protokol komutları ve cihaz yanıtları"
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-800 px-3 py-1 text-xs text-slate-300">
            <DoorOpen className="size-3.5" />
            {events.length} olay
          </span>
        }
      >
        <ul className="max-h-80 space-y-2 overflow-y-auto font-mono text-xs">
          {events.length === 0 && (
            <li className="text-slate-600">Henüz olay yok. Bir cihaz komutu gönderin.</li>
          )}
          {events.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-obsidian-700 bg-obsidian-950/60 px-3 py-2"
            >
              <span className="text-slate-600">
                {new Date(e.at).toLocaleTimeString('tr-TR')}
              </span>{' '}
              <span className="text-lykia-300">[{e.deviceId}]</span>{' '}
              <span className="text-sky-300">{e.action}</span>
              <span className="text-emerald-200/80"> — {e.detail}</span>
              {e.mode && <span className="text-slate-600"> · {e.mode}</span>}
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
