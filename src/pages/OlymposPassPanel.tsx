import { useState } from 'react';
import {
  BadgeCheck,
  BadgeX,
  DoorOpen,
  ScanLine,
  Ticket,
  Users,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import type { AccessEvent, PassHolder, PassTier } from '../types';

const HOLDERS: PassHolder[] = [
  {
    id: 'OLP-7A21',
    name: 'Elif Kaya',
    tier: 'Platin',
    zones: ['Ana Kapı', 'VIP Salon', 'Marina', 'Teleferik'],
    lastEntry: '09:42',
    active: true,
  },
  {
    id: 'OLP-3F08',
    name: 'Mert Demir',
    tier: 'Altın',
    zones: ['Ana Kapı', 'Marina', 'Plaj'],
    lastEntry: '10:15',
    active: true,
  },
  {
    id: 'OLP-9C44',
    name: 'Zeynep Arslan',
    tier: 'Gümüş',
    zones: ['Ana Kapı', 'Plaj'],
    lastEntry: '08:30',
    active: true,
  },
  {
    id: 'OLP-1B77',
    name: 'Can Yılmaz',
    tier: 'Standart',
    zones: ['Ana Kapı'],
    lastEntry: 'Dün 17:05',
    active: false,
  },
];

const RECENT_EVENTS: AccessEvent[] = [
  { id: 1, holder: 'Elif Kaya', gate: 'VIP Salon', time: '10:31', allowed: true },
  { id: 2, holder: 'Mert Demir', gate: 'Marina', time: '10:15', allowed: true },
  { id: 3, holder: 'Bilinmeyen kart', gate: 'Teleferik', time: '09:58', allowed: false },
  { id: 4, holder: 'Zeynep Arslan', gate: 'Plaj', time: '09:47', allowed: true },
  { id: 5, holder: 'Can Yılmaz', gate: 'VIP Salon', time: '09:12', allowed: false },
];

const TIER_STYLE: Record<PassTier, string> = {
  Platin: 'bg-violet-500/15 text-violet-300',
  Altın: 'bg-lykia-500/15 text-lykia-300',
  Gümüş: 'bg-slate-400/15 text-slate-300',
  Standart: 'bg-sky-500/15 text-sky-300',
};

type VerifyResult =
  | { state: 'valid'; holder: PassHolder }
  | { state: 'invalid'; reason: string }
  | null;

export default function OlymposPassPanel() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VerifyResult>(null);

  const verify = () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    if (!/^OLP-[A-Z0-9]{4}$/.test(normalized)) {
      setResult({ state: 'invalid', reason: 'Kod biçimi geçersiz. Beklenen biçim: OLP-XXXX' });
      return;
    }
    const holder = HOLDERS.find((h) => h.id === normalized);
    if (!holder) {
      setResult({ state: 'invalid', reason: 'Kod sistemde kayıtlı değil.' });
      return;
    }
    if (!holder.active) {
      setResult({ state: 'invalid', reason: `${holder.name} adlı kullanıcının kartı pasif durumda.` });
      return;
    }
    setResult({ state: 'valid', holder });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
          <Ticket className="size-6 text-lykia-400" />
          OlymposPass Yönetim Paneli
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Kullanıcı geçişleri, erişim yetkileri ve kart/kod doğrulama.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PanelCard
          title="Kart / Kod Doğrulama"
          subtitle="OlymposPass kodunu okutun veya girin"
        >
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') verify();
              }}
              placeholder="OLP-7A21"
              className="w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-4 py-2.5 font-mono text-sm uppercase text-slate-200 placeholder:text-slate-600 focus:border-lykia-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={verify}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950 transition hover:bg-lykia-400"
            >
              <ScanLine className="size-4" />
              Doğrula
            </button>
          </div>

          {result?.state === 'valid' && (
            <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <BadgeCheck className="size-5" />
                Geçiş onaylandı
              </p>
              <p className="mt-2 text-sm text-slate-200">{result.holder.name}</p>
              <p className="text-xs text-slate-400">
                Seviye: {result.holder.tier} · Yetkili bölgeler:{' '}
                {result.holder.zones.join(', ')}
              </p>
            </div>
          )}
          {result?.state === 'invalid' && (
            <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/8 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-rose-300">
                <BadgeX className="size-5" />
                Geçiş reddedildi
              </p>
              <p className="mt-2 text-xs text-slate-400">{result.reason}</p>
            </div>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-slate-600">
            Deneme kodları: OLP-7A21 (Platin), OLP-3F08 (Altın), OLP-1B77 (pasif kart).
          </p>
        </PanelCard>

        <PanelCard
          title="Kayıtlı Kullanıcılar & Erişim Yetkileri"
          subtitle="Pass sahipleri ve bölge yetkileri"
          className="xl:col-span-2"
          actions={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-800 px-3 py-1 text-xs font-medium text-slate-300">
              <Users className="size-3.5" />
              {HOLDERS.length} kullanıcı
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-obsidian-700 text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4">Kod</th>
                  <th className="pb-3 pr-4">Kullanıcı</th>
                  <th className="pb-3 pr-4">Seviye</th>
                  <th className="pb-3 pr-4">Yetkili Bölgeler</th>
                  <th className="pb-3 pr-4">Son Giriş</th>
                  <th className="pb-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-700/60">
                {HOLDERS.map((h) => (
                  <tr key={h.id}>
                    <td className="py-3 pr-4 font-mono text-lykia-300">{h.id}</td>
                    <td className="py-3 pr-4 text-slate-100">{h.name}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${TIER_STYLE[h.tier]}`}
                      >
                        {h.tier}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-400">{h.zones.join(', ')}</td>
                    <td className="py-3 pr-4 text-slate-400">{h.lastEntry}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs font-medium ${h.active ? 'text-emerald-300' : 'text-slate-500'}`}
                      >
                        {h.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Son Geçiş Olayları" subtitle="Kapı bazlı canlı erişim kayıtları">
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {RECENT_EVENTS.map((e) => (
            <li
              key={e.id}
              className={`rounded-xl border p-4 ${
                e.allowed
                  ? 'border-obsidian-700 bg-obsidian-950/60'
                  : 'border-rose-500/25 bg-rose-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <DoorOpen
                  className={`size-4 ${e.allowed ? 'text-emerald-400' : 'text-rose-400'}`}
                />
                <span className="text-xs text-slate-500">{e.time}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-200">{e.holder}</p>
              <p className="text-xs text-slate-500">{e.gate}</p>
              <p
                className={`mt-2 text-[11px] font-semibold ${
                  e.allowed ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {e.allowed ? 'İZİN VERİLDİ' : 'REDDEDİLDİ'}
              </p>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
