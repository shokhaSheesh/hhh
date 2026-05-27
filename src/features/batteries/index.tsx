import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BatteryFull, Search, BatteryCharging, BatteryWarning } from 'lucide-react';
import { useBatteries } from './hooks/useBatteries';
import { useDebounce } from '@/hooks/useDebounce';
import { FilterDropdown } from '@/components/FilterDropdown';
import { createApi, VIEW } from '@/api/client';
import type { Battery, BatteriesListResponse } from '@/types/batteries';

// ─── Stat card ────────────────────────────────────────────────────────────────

const battApi = createApi(VIEW.batteries);

function StatCard({ label, value, icon: Icon, iconBg }: {
  label: string; value: number | null; icon: React.ElementType; iconBg: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-4">
      <div>
        <p className="text-sm text-Color-Grey-Grey-600">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-Color-Grey-Grey-950">
          {value === null ? (
            <span className="inline-block h-7 w-16 animate-pulse rounded-lg bg-Color-Grey-Grey-200" />
          ) : (
            <>{value.toLocaleString('ru-RU')} ta</>
          )}
        </p>
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}

function useBatteryCounts() {
  const [activeCount,   setActiveCount]   = useState<number | null>(null);
  const [inactiveCount, setInactiveCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      battApi.post<BatteriesListResponse>('/batteries/items/list', { data: { offset: 0, limit: 1, status: true  } }),
      battApi.post<BatteriesListResponse>('/batteries/items/list', { data: { offset: 0, limit: 1, status: false } }),
    ]).then(([a, b]) => {
      if (cancelled) return;
      setActiveCount(a.data.data.count ?? 0);
      setInactiveCount(b.data.data.count ?? 0);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return { activeCount, inactiveCount };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    const utc = /Z|[+-]\d\d:\d\d$/.test(iso) ? iso : iso + 'Z';
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Tashkent',
    }).format(new Date(utc));
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
    <span className="inline-flex items-center rounded-full border border-Color-Success-Success bg-Color-Success-Success-Soft px-2.5 py-0.5 text-xs font-medium text-Color-Success-Success">
      Faol
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-medium text-Color-Grey-Grey-600">
      Nofaol
    </span>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function BatteryRow({ battery }: { battery: Battery }) {
  return (
    <div className="flex min-w-max items-center gap-0 border-b border-Color-Grey-Grey-200 transition-colors hover:bg-Color-Grey-Grey-50">
      {/* Seriya raqami */}
      <div className="w-72 shrink-0 py-3 pl-6 pr-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-Color-Primary-Primary/10">
            <BatteryFull className="h-4 w-4 text-Color-Primary-Primary" />
          </div>
          <span className="font-mono text-sm text-Color-Grey-Grey-950">{battery.battery_sn}</span>
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
        <span className="text-sm text-Color-Grey-Grey-600">{fmtDate(battery.created_at)}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 20;

function Pagination({ page, total, limit, label, onChange }: {
  page: number; total: number; limit: number; label: string; onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);
  const pgs: (number | '...')[] = [];
  const add = (n: number) => { if (!pgs.includes(n)) pgs.push(n); };
  add(1);
  if (page > 3) pgs.push('...');
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) add(p);
  if (page < totalPages - 2) pgs.push('...');
  if (totalPages > 1) add(totalPages);
  return (
    <div className="flex items-center justify-between border-t border-Color-Grey-Grey-200 px-6 py-4">
      <span className="text-xs text-Color-Grey-Grey-600">{from}–{to} / {total.toLocaleString('ru-RU')} {label}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pgs.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1 text-xs text-Color-Grey-Grey-400">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p as number)}
              className={['h-7 min-w-[28px] rounded-lg px-2 text-xs font-medium transition-colors',
                p === page ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark' : 'text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-100',
              ].join(' ')}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const RANGE_OPTIONS = [
  { value: 'low',  label: '0 – 49%'   },
  { value: 'mid',  label: '50 – 74%'  },
  { value: 'high', label: '75 – 100%' },
];

export default function BatteriesPage() {
  const [page,      setPage]      = useState(1);
  const [rawSearch, setRawSearch] = useState('');
  const [socRange,  setSocRange]  = useState<string | null>(null);
  const [sohRange,  setSohRange]  = useState<string | null>(null);
  const search = useDebounce(rawSearch, 350);

  const { batteries, total, loading, error } = useBatteries({ page, limit: LIMIT, search, socRange, sohRange });
  const { activeCount, inactiveCount } = useBatteryCounts();

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-Color-Grey-Grey-950">Batareyalar</h1>
          <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Batareya inventari va holati</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Jami"   value={total}         icon={BatteryFull}    iconBg="bg-blue-600"    />
        <StatCard label="Faol"   value={activeCount}   icon={BatteryCharging} iconBg="bg-emerald-600" />
        <StatCard label="Nofaol" value={inactiveCount} icon={BatteryWarning}  iconBg="bg-red-500"     />
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        <div className="flex flex-wrap items-center gap-3 border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-Color-Grey-Grey-950 shrink-0">Batareyalar jadvali</h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-Color-Grey-Grey-500" />
            <input
              type="text"
              value={rawSearch}
              onChange={(e) => { setRawSearch(e.target.value); setPage(1); }}
              placeholder="Seriya raqami..."
              className="w-56 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 py-2 pl-9 pr-4 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400"
            />
          </div>
          <FilterDropdown
            placeholder="SOC (Quvvat)"
            options={RANGE_OPTIONS}
            value={socRange}
            onChange={(v) => { setSocRange(v); setPage(1); }}
          />
          <FilterDropdown
            placeholder="SOH (Sog'liq)"
            options={RANGE_OPTIONS}
            value={sohRange}
            onChange={(v) => { setSohRange(v); setPage(1); }}
          />
        </div>

        {error && (
          <div className="px-6 py-4 text-sm text-Color-Danger-Danger-Accent">{error}</div>
        )}

        <div className="overflow-x-auto">
          {/* Header row */}
          <div className="flex min-w-max items-center gap-0 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50">
            {[
              { label: 'Seriya raqami', w: 'w-72', pl: true },
              { label: 'Quvvat (SOC)',  w: 'w-44'           },
              { label: "Sog'lomligi (SOH)", w: 'w-44'       },
              { label: 'Holati',        w: 'w-32'           },
              { label: "Qo'shilgan sana", w: 'w-44'         },
            ].map(({ label, w, pl }) => (
              <div key={label} className={`${w} shrink-0 px-4 py-3 ${pl ? 'pl-6' : ''}`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="flex min-w-max items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-Color-Primary-Primary border-t-transparent" />
            </div>
          ) : batteries.length === 0 ? (
            <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">Batareyalar topilmadi</div>
          ) : (
            batteries.map((battery) => (
              <BatteryRow key={battery.guid} battery={battery} />
            ))
          )}
        </div>

        {!loading && <Pagination page={page} total={total} limit={LIMIT} label="ta batareya" onChange={setPage} />}
      </div>
    </div>
  );
}
