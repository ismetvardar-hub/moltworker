import type { ReactNode } from 'react';

interface PanelCardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function PanelCard({
  title,
  subtitle,
  actions,
  children,
  className = '',
}: PanelCardProps) {
  return (
    <section
      className={`rounded-2xl border border-obsidian-700 bg-obsidian-900/80 shadow-lg shadow-black/20 ${className}`}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-obsidian-700 px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-bold tracking-wide text-slate-100">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
