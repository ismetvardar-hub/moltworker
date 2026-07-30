import type { SystemHealth } from '../types';

const STYLES: Record<SystemHealth, { dot: string; text: string; label: string }> = {
  online: { dot: 'bg-emerald-400', text: 'text-emerald-300', label: 'Çevrimiçi' },
  degraded: { dot: 'bg-amber-400', text: 'text-amber-300', label: 'Kısıtlı' },
  offline: { dot: 'bg-rose-500', text: 'text-rose-300', label: 'Çevrimdışı' },
  unknown: { dot: 'bg-slate-500', text: 'text-slate-400', label: 'Bilinmiyor' },
};

export default function StatusBadge({
  health,
  label,
}: {
  health: SystemHealth;
  label?: string;
}) {
  const style = STYLES[health];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span className={`size-2 rounded-full ${style.dot}`} />
      {label ?? style.label}
    </span>
  );
}
