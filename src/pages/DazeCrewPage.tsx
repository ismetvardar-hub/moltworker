import { useMemo, useState } from 'react';
import {
  Award,
  Calculator,
  CheckCircle2,
  Circle,
  GraduationCap,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import PanelCard from '../components/PanelCard';

interface CrewTask {
  id: number;
  label: string;
  zone: string;
  done: boolean;
}

interface CrewMember {
  name: string;
  role: string;
  shift: string;
  performance: number;
  courtesy: number;
  badge?: string;
}

const INITIAL_TASKS: CrewTask[] = [
  { id: 1, label: 'VIP Salon servis hazırlığı', zone: 'VIP Salon', done: true },
  { id: 2, label: 'Plaj girişi turnike kontrolü', zone: 'Plaj', done: true },
  { id: 3, label: 'Öğle vardiya devir teslimi', zone: 'Ana Kapı', done: false },
  { id: 4, label: 'Termal koruma ünitesini yenile', zone: 'Mutfak', done: false },
  { id: 5, label: 'SOCRATES nezaket senaryosunu tamamla', zone: 'Akademi', done: false },
];

const CREW: CrewMember[] = [
  {
    name: 'Ayşe T.',
    role: 'Vardiya Şefi',
    shift: '08:00–16:00',
    performance: 94,
    courtesy: 9.6,
    badge: 'Ayın Centilmeni',
  },
  { name: 'Burak S.', role: 'Servis', shift: '08:00–16:00', performance: 88, courtesy: 9.1 },
  { name: 'Selin M.', role: 'Kapı Görevlisi', shift: '12:00–20:00', performance: 91, courtesy: 9.4 },
  { name: 'Kaan Y.', role: 'Mutfak Yardımcısı', shift: '12:00–20:00', performance: 82, courtesy: 8.7 },
];

export default function DazeCrewPage() {
  const [hourlyRate, setHourlyRate] = useState(180);
  const [hoursWorked, setHoursWorked] = useState(6.5);
  const [bonusPercent, setBonusPercent] = useState(12);
  const [tasks, setTasks] = useState<CrewTask[]>(INITIAL_TASKS);

  const earnings = useMemo(() => {
    const base = hourlyRate * hoursWorked;
    const bonus = base * (bonusPercent / 100);
    return { base, bonus, total: base + bonus };
  }, [hourlyRate, hoursWorked, bonusPercent]);

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const doneCount = tasks.filter((t) => t.done).length;
  const tl = (n: number) =>
    n.toLocaleString('tr-TR', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-50">
          <Users className="size-6 text-lykia-400" />
          Daze Crew — Personel Portalı
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Saatlik kazanç, canlı görev listesi ve DAZE-CREW / SOCRATES performans puanlaması.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PanelCard
          title="Saatlik Kazanç Hesaplayıcı"
          subtitle="DAZE-CREW anlık kazancınızı hesaplar"
        >
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-400">Saatlik ücret (₺)</span>
              <input
                type="number"
                min={0}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-obsidian-700 bg-obsidian-950 px-4 py-2.5 font-mono text-sm text-slate-200 focus:border-lykia-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-400">
                Bugünkü çalışma süresi: <span className="font-mono text-lykia-300">{hoursWorked.toFixed(1)} saat</span>
              </span>
              <input
                type="range"
                min={0}
                max={12}
                step={0.5}
                value={hoursWorked}
                onChange={(e) => setHoursWorked(Number(e.target.value))}
                className="mt-2 w-full accent-lykia-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-400">
                Performans primi: <span className="font-mono text-lykia-300">%{bonusPercent}</span>
              </span>
              <input
                type="range"
                min={0}
                max={30}
                value={bonusPercent}
                onChange={(e) => setBonusPercent(Number(e.target.value))}
                className="mt-2 w-full accent-lykia-500"
              />
            </label>

            <div className="rounded-xl border border-lykia-500/25 bg-lykia-500/5 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Taban kazanç</span>
                <span className="font-mono">₺{tl(earnings.base)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>Performans primi</span>
                <span className="font-mono text-emerald-300">+₺{tl(earnings.bonus)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-obsidian-700 pt-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Wallet className="size-4 text-lykia-400" />
                  Bugünkü toplam
                </span>
                <span className="font-mono text-xl font-bold text-lykia-300">
                  ₺{tl(earnings.total)}
                </span>
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <Calculator className="size-3.5" />
              Prim oranı SOCRATES nezaket puanı ve vardiya performansından türetilir.
            </p>
          </div>
        </PanelCard>

        <PanelCard
          title="Canlı Görev Listesi"
          subtitle="Vardiya talimatları DAZE-CREW tarafından atanır"
          actions={
            <span className="rounded-full bg-obsidian-800 px-3 py-1 text-xs font-medium text-slate-300">
              {doneCount}/{tasks.length} tamam
            </span>
          }
        >
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-obsidian-700">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(doneCount / tasks.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    task.done
                      ? 'border-emerald-500/25 bg-emerald-500/5 text-slate-400 line-through'
                      : 'border-obsidian-700 bg-obsidian-950/60 text-slate-200 hover:border-lykia-500/40'
                  }`}
                >
                  {task.done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-slate-600" />
                  )}
                  <span className="flex-1">{task.label}</span>
                  <span className="shrink-0 rounded-full bg-obsidian-800 px-2 py-0.5 text-[10px] text-slate-500">
                    {task.zone}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard
          title="Performans Puanlama"
          subtitle="DAZE-CREW performans · SOCRATES centilmenlik puanı"
        >
          <ul className="space-y-3">
            {CREW.map((member) => (
              <li
                key={member.name}
                className="rounded-xl border border-obsidian-700 bg-obsidian-950/60 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      {member.name}
                      {member.badge && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-lykia-500/15 px-2 py-0.5 text-[10px] font-semibold text-lykia-300">
                          <Award className="size-3" />
                          {member.badge}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {member.role} · {member.shift}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Performans
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-obsidian-700">
                        <div
                          className="h-full rounded-full bg-sky-400"
                          style={{ width: `${member.performance}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-sky-300">{member.performance}</span>
                    </div>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-600">
                      <GraduationCap className="size-3" />
                      Centilmenlik
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <Star className="size-3.5 text-lykia-400" />
                      <span className="font-mono text-xs text-lykia-300">
                        {member.courtesy.toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>
    </div>
  );
}
