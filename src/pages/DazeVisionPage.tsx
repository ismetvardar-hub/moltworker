import { useEffect, useMemo, useState } from 'react';
import {
  Gift,
  HeartHandshake,
  LineChart,
  Refrigerator,
  Send,
  Shirt,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';
import { uid } from '../utils/uid';

// ─── MINT dinamik borsa ───────────────────────────────────────────────

interface MarketProduct {
  name: string;
  base: number;
  history: number[];
}

const INITIAL_MARKET: MarketProduct[] = [
  { name: 'Çay', base: 40, history: [40, 41, 40, 42, 43, 42, 44, 43, 42, 44] },
  { name: 'Türk Kahvesi', base: 90, history: [90, 92, 91, 94, 93, 95, 94, 96, 95, 97] },
  { name: 'Tost', base: 120, history: [120, 118, 121, 119, 122, 124, 123, 121, 124, 126] },
];

function nextPrice(current: number, base: number): number {
  // Yoğunluk simülasyonu: taban etrafında ±%6 bandında rastgele yürüyüş.
  const drift = (base - current) * 0.08;
  const noise = (Math.random() - 0.5) * base * 0.04;
  return Math.max(base * 0.85, Math.min(base * 1.2, current + drift + noise));
}

function Sparkline({ points, rising }: { points: number[]; rising: boolean }) {
  const path = useMemo(() => {
    const w = 220;
    const h = 56;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    return points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - ((p - min) / span) * (h - 8) - 4;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points]);

  return (
    <svg viewBox="0 0 220 56" className="h-14 w-full">
      <path
        d={path}
        fill="none"
        stroke={rising ? '#34d399' : '#fb7185'}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Daze-Gift ────────────────────────────────────────────────────────

const GUESTS = ['Elif Kaya', 'Mert Demir', 'Zeynep Arslan', 'Can Yılmaz'];
const GIFTS = ['Çay ikramı ☕', 'Günün tatlısı 🍮', 'Türk kahvesi ☕', 'Dondurma 🍦'];

interface GiftRecord {
  id: number;
  guest: string;
  gift: string;
  message: string;
  time: string;
}

const GIFT_MESSAGES = [
  'puanlarınız bugün size bir {gift} kazandırdı. Afiyetle!',
  'sadakatiniz taçlandı: {gift} ikramımızdır. Nazikçe servis edilir.',
  '5. fişiniz doldu! {gift} bizden — kuyruğa gerek yok, biz getiriyoruz.',
];

// ─── Yaşam Koçu ───────────────────────────────────────────────────────

const COACH_TIPS = [
  {
    icon: Refrigerator,
    title: 'Buzdolabı Analizi',
    tip: 'Dolabınızdaki malzemelerle bugün pratik bir menemen olur; domatesler tam kıvamında.',
  },
  {
    icon: Shirt,
    title: 'Kıyafet Önerisi',
    tip: 'Bugün Olympos 31°C ve hafif meltem: keten gömlek + şapka kombinasyonu tam isabet.',
  },
  {
    icon: Sparkles,
    title: 'Günün Motivasyonu',
    tip: 'Plaj yoğunluğu 16:00\u2019dan sonra azalıyor — gün batımı yüzmesi için ideal pencere.',
  },
];

export default function DazeVisionPage() {
  const [market, setMarket] = useState<MarketProduct[]>(INITIAL_MARKET);
  const [guest, setGuest] = useState(GUESTS[0]);
  const [gift, setGift] = useState(GIFTS[0]);
  const [giftLog, setGiftLog] = useState<GiftRecord[]>([]);
  const [tipIndex, setTipIndex] = useState(0);

  // MINT borsa güncellemesi
  useEffect(() => {
    const timer = setInterval(() => {
      setMarket((prev) =>
        prev.map((p) => {
          const next = nextPrice(p.history[p.history.length - 1], p.base);
          const history = [...p.history.slice(-19), next];
          return { ...p, history };
        }),
      );
    }, 1600);
    return () => clearInterval(timer);
  }, []);

  // Yaşam koçu ipuçları döngüsü
  useEffect(() => {
    const timer = setInterval(() => setTipIndex((i) => (i + 1) % COACH_TIPS.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const sendGift = () => {
    const template = GIFT_MESSAGES[giftLog.length % GIFT_MESSAGES.length];
    const record: GiftRecord = {
      id: uid(),
      guest,
      gift,
      message: `Sayın ${guest.split(' ')[0]}, ${template.replace('{gift}', gift.replace(/\s\S+$/, '').toLowerCase())}`,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    setGiftLog((prev) => [record, ...prev].slice(0, 5));
  };

  const CoachIcon = COACH_TIPS[tipIndex].icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
          <HeartHandshake className="size-6 text-lykia-400" />
          Daze Vision — Müşteri Portalı
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          MINT dinamik borsa, Daze-Gift ikram simülatörü ve DAZE-VISION Yaşam Koçu.
        </p>
      </div>

      <PanelCard
        title="Mutfak Borsası — Canlı Fiyatlar"
        subtitle="MINT algoritması yoğunluğa göre fiyatları esnetir"
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <LineChart className="size-3.5" />
            CANLI
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {market.map((p) => {
            const current = p.history[p.history.length - 1];
            const prev = p.history[p.history.length - 2] ?? current;
            const rising = current >= prev;
            const changePct = ((current - p.base) / p.base) * 100;
            return (
              <div
                key={p.name}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 p-4"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-slate-100">{p.name}</p>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      rising ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {rising ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    {changePct >= 0 ? '+' : ''}
                    {changePct.toFixed(1)}%
                  </span>
                </div>
                <p className="mt-1 font-mono text-2xl font-bold text-lykia-300">
                  ₺{current.toFixed(0)}
                </p>
                <Sparkline points={p.history} rising={rising} />
                <p className="text-[10px] text-slate-600">taban: ₺{p.base} · MINT esnetme bandı ±%20</p>
              </div>
            );
          })}
        </div>
      </PanelCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard
          title="Daze-Gift İkram Simülatörü"
          subtitle="AURA puanlarına göre ikram gönderin; mesajı ETHOS üslup filtresinden geçer"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-400">Misafir</span>
              <select
                value={guest}
                onChange={(e) => setGuest(e.target.value)}
                className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2.5 text-sm text-slate-200 focus:border-lykia-500 focus:outline-none"
              >
                {GUESTS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-400">İkram</span>
              <select
                value={gift}
                onChange={(e) => setGift(e.target.value)}
                className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-3 py-2.5 text-sm text-slate-200 focus:border-lykia-500 focus:outline-none"
              >
                {GIFTS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={sendGift}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-lykia-500 px-4 py-2.5 text-sm font-semibold text-obsidian-950 transition hover:bg-lykia-400"
          >
            <Gift className="size-4" />
            İkramı Gönder
          </button>

          <ul className="mt-4 space-y-2">
            {giftLog.length === 0 && (
              <li className="rounded-xl border border-dashed border-obsidian-700 p-4 text-center text-xs text-slate-600">
                Henüz ikram gönderilmedi. İlk zarafeti siz gösterin!
              </li>
            )}
            {giftLog.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <Send className="size-3.5" />
                    {r.guest} → {r.gift}
                  </p>
                  <span className="text-[10px] text-slate-600">{r.time}</span>
                </div>
                <p className="mt-1.5 text-xs italic leading-relaxed text-slate-400">
                  "{r.message}" <span className="text-lykia-400/80">— ETHOS onaylı ✓</span>
                </p>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard
          title="DAZE-VISION Yaşam Koçu"
          subtitle="Kişiselleştirilmiş öneriler 6 saniyede bir yenilenir"
        >
          <div className="rounded-xl border border-lykia-500/25 bg-lykia-500/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-lykia-500/15 text-lykia-400">
                <CoachIcon className="size-6" />
              </div>
              <p className="text-sm font-bold text-slate-100">{COACH_TIPS[tipIndex].title}</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {COACH_TIPS[tipIndex].tip}
            </p>
          </div>

          <div className="mt-3 flex justify-center gap-1.5">
            {COACH_TIPS.map((t, i) => (
              <button
                key={t.title}
                type="button"
                onClick={() => setTipIndex(i)}
                aria-label={t.title}
                className={`size-2 rounded-full transition ${
                  i === tipIndex ? 'bg-lykia-400' : 'bg-obsidian-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Bugünkü adım', value: '6.480' },
              { label: 'Güneş endeksi', value: 'UV 7' },
              { label: 'Su hatırlatması', value: '3/8 bardak' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 p-3"
              >
                <p className="font-mono text-sm font-bold text-slate-100">{stat.value}</p>
                <p className="mt-0.5 text-[10px] text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
