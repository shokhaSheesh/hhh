import { useState } from 'react';
import { ChevronLeft, ChevronRight, BatteryFull } from 'lucide-react';
import { useBatteries } from './hooks/useBatteries';
import type { Battery } from '@/types/batteries';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

// ─── SOC / SOH bar ────────────────────────────────────────────────────────────

function SocBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const [bgFill, bgTrack] =
    pct > 80  ? ['bg-emerald-500', 'bg-emerald-500/15']
    : pct >= 30 ? ['bg-yellow-500',  'bg-yellow-500/15']
    :             ['bg-red-500',     'bg-red-500/15'];

  return (
    <div className={`relative h-6 w-24 overflow-hidden rounded-lg ${bgTrack}`}>
      <div
        className={`absolute left-0 top-0 h-full rounded-lg ${bgFill}`}
        style={{ width: `${pct}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-sm">
        {pct}%
      </span>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
      Faol
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-gray-600/30 bg-gray-700/30 px-2.5 py-0.5 text-xs font-medium text-gray-500">
      Nofaol
    </span>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function BatteryRow({ battery }: { battery: Battery }) {
  return (
    <div className="flex min-w-max items-center gap-0 border-b border-dark-border/60 transition-colors hover:bg-white/[0.02]">
      {/* Seriya raqami */}
      <div className="w-72 shrink-0 py-3 pl-6 pr-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-lime/10">
            <BatteryFull className="h-4 w-4 text-brand-lime" />
          </div>
          <span className="font-mono text-sm text-white">{battery.battery_sn}</span>
        </div>
      </div>

      {/* SOC — Quvvat */}
      <div className="w-44 shrink-0 px-4 py-3">
        <SocBar value={battery.soc} />
      </div>

      {/* SOH — Sog'lomligi */}
      <div className="w-44 shrink-0 px-4 py-3">
        <SocBar value={battery.soh} />
      </div>

      {/* Holati */}
      <div className="w-32 shrink-0 px-4 py-3">
        <StatusBadge active={battery.status} />
      </div>

      {/* Qo'shilgan sana */}
      <div className="w-44 shrink-0 px-4 py-3">
        <span className="text-sm text-gray-400">{fmtDate(battery.created_at)}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 20;

export default function BatteriesPage() {
  const [page, setPage] = useState(1);

  const { batteries, total, loading, error } = useBatteries({ page, limit: LIMIT });

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Batareyalar</h1>
          <p className="mt-0.5 text-sm text-gray-500">Batareya inventari va holati</p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-dark-border bg-dark-surface">
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Batareyalar jadvali</h2>
        </div>

        {error && (
          <div className="px-6 py-4 text-sm text-red-400">{error}</div>
        )}

        <div className="overflow-x-auto">
          {/* Header row */}
          <div className="flex min-w-max items-center gap-0 border-b border-dark-border bg-gray-900/40">
            {[
              { label: 'Seriya raqami', w: 'w-72', pl: true },
              { label: 'Quvvat (SOC)',  w: 'w-44'           },
              { label: "Sog'lomligi (SOH)", w: 'w-44'       },
              { label: 'Holati',        w: 'w-32'           },
              { label: "Qo'shilgan sana", w: 'w-44'         },
            ].map(({ label, w, pl }) => (
              <div key={label} className={`${w} shrink-0 px-4 py-3 ${pl ? 'pl-6' : ''}`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="flex min-w-max items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-lime border-t-transparent" />
            </div>
          ) : batteries.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-600">Batareyalar topilmadi</div>
          ) : (
            batteries.map((battery) => (
              <BatteryRow key={battery.guid} battery={battery} />
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-dark-border px-6 py-4">
            <p className="text-xs text-gray-500">Jami {total} ta batareya</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-border bg-dark-surface text-gray-400 transition-colors hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-400">{page} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-border bg-dark-surface text-gray-400 transition-colors hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
