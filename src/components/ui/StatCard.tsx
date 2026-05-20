import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  /** Tailwind background class for the icon container, e.g. "bg-emerald-500" */
  iconBg: string;
  /** Optional sub-label beneath the value (e.g. trend text) */
  subLabel?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  subLabel,
}: StatCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-dark-border bg-dark-surface p-5 transition-colors hover:border-gray-700">
      {/* Text */}
      <div className="min-w-0 flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-400 truncate">{title}</span>
        <span className="text-2xl font-semibold tracking-tight text-white leading-8">
          {value}
        </span>
        {subLabel && (
          <span className="text-xs text-gray-500">{subLabel}</span>
        )}
      </div>

      {/* Icon badge */}
      <div
        className={[
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
          iconBg,
        ].join(' ')}
      >
        <Icon className="h-7 w-7 text-white" strokeWidth={1.75} />
      </div>
    </div>
  );
}
