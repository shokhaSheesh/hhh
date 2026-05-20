import { useState } from 'react';
import {
  Search, Download, ChevronLeft, ChevronRight,
  AlertCircle, ArrowDownToLine, ArrowUpFromLine, Activity,
} from 'lucide-react';
import { useSwaps } from './hooks/useSwaps';
import { useDebounce } from '@/hooks/useDebounce';
import type { SwapRecord, SwapStatus } from '@/types/swaps';

const PAGE_SIZE = 15;

// ─── Formatters ───────────────────────────────────────────────────────────────

function shortId(guid: string) {
  return guid.slice(-6).toUpperCase();
}

function fmtDate(raw: string) {
  if (!raw) return '—';
  // already "17.05.2026 10:11" format from API — return as-is
  if (/^\d{2}\.\d{2}\.\d{4}/.test(raw)) return raw;
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(raw));
  } catch { return raw; }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<SwapStatus, { label: string; cls: string }> = {
  bound:   { label: 'Qaytarildi',   cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  unbound: { label: 'Qaytarilmadi', cls: 'border-orange-500/30  bg-orange-500/10  text-orange-400'  },
};

function StatusBadge({ status }: { status: SwapStatus[] }) {
  const key = (status[0] ?? 'unbound') as SwapStatus;
  const { label, cls } = STATUS_MAP[key] ?? STATUS_MAP.unbound;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconBg }: {
  label: string; value: number | string; icon: React.ElementType; iconBg: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-dark-border bg-dark-surface p-4">
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-white">{value} ta</p>
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}

// ─── Column widths ────────────────────────────────────────────────────────────

const COL = {
  id:      'w-20 shrink-0',
  user:    'w-52 shrink-0',
  battery: 'w-44 shrink-0',
  device:  'w-40 shrink-0',
  station: 'flex-1 min-w-0',
  time:    'w-36 shrink-0',
  status:  'w-32 shrink-0',
} as const;

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({ swap }: { swap: SwapRecord }) {
  const user   = swap.users_id_data;
  const device = swap.devices_id_data;
  const batt   = swap.batteries_id_data;

  return (
    <div className="flex items-center gap-4 border-b border-dark-border px-4 py-4 transition-colors hover:bg-white/[0.04]">
      <span className={`${COL.id} font-mono text-sm font-semibold text-white`}>
        {shortId(swap.guid)}
      </span>

      {/* User */}
      <div className={`${COL.user} flex items-center gap-2.5 min-w-0`}>
        {user.photo ? (
          <img src={user.photo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-white">
            {user.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold capitalize text-white">
            {user.name.toLowerCase()}
          </p>
          <p className="font-mono text-xs text-gray-500">{user.phone}</p>
        </div>
      </div>

      {/* Battery SN */}
      <div className={`${COL.battery} min-w-0`}>
        <p className="truncate font-mono text-xs text-gray-300">{batt.battery_sn}</p>
        <p className="mt-0.5 text-xs text-gray-600">
          SOC: <span className="text-gray-400">{batt.soc}%</span>
        </p>
      </div>

      {/* Device name */}
      <div className={`${COL.device} min-w-0`}>
        <p className="truncate text-sm font-semibold text-white">{device.device_name}</p>
      </div>

      {/* Station address */}
      <div className={`${COL.station} min-w-0`}>
        <p className="truncate text-sm text-gray-300">{device.device_location || device.address || '—'}</p>
      </div>

      {/* Time */}
      <span className={`${COL.time} font-mono text-xs text-gray-400`}>
        {fmtDate(swap.unbound_at)}
      </span>

      {/* Status */}
      <div className={COL.status}>
        <StatusBadge status={swap.status} />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-dark-border px-4 py-4">
          <div className={`${COL.id}      h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.user}    space-y-1.5`}>
            <div className="h-4 w-36 animate-pulse rounded bg-gray-800" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-800" />
          </div>
          <div className={`${COL.battery} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.station} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.device}  h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.station} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.time}    h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.status}  h-6 w-24 animate-pulse rounded-full bg-gray-800`} />
        </div>
      ))}
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, total, pageSize, onChange }: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  const pages: (number | '...')[] = [];
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };
  add(1);
  if (page > 3) pages.push('...');
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) add(p);
  if (page < totalPages - 2) pages.push('...');
  if (totalPages > 1) add(totalPages);

  return (
    <div className="flex items-center justify-between border-t border-dark-border px-6 py-4">
      <span className="text-xs text-gray-500">
        {from}–{to} / {total.toLocaleString('ru-RU')} almashtirish
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1 text-xs text-gray-600">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p as number)}
              className={['h-7 min-w-[28px] rounded-lg px-2 text-xs font-medium transition-colors',
                p === page ? 'bg-[#D1F22D] text-black' : 'text-gray-400 hover:bg-white/5',
              ].join(' ')}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === Math.ceil(total / pageSize)}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Table header ─────────────────────────────────────────────────────────────

const HEADERS: [string, string][] = [
  ['ID',            COL.id],
  ['Foydalanuvchi', COL.user],
  ['Batareya SN',   COL.battery],
  ['Qurilma nomi',  COL.device],
  ['Manzil',        COL.station],
  ['Vaqti',         COL.time],
  ['Holati',        COL.status],
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SwapsPage() {
  const [page,      setPage]      = useState(1);
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebounce(rawSearch, 400);

  const handleSearch = (v: string) => { setRawSearch(v); setPage(1); };

  const { swaps, total, loading, error } = useSwaps({ page, limit: PAGE_SIZE, search });

  const counts = swaps.reduce(
    (acc, s) => {
      if (s.status[0] === 'bound')   acc.returned++;
      else if (s.status[0] === 'unbound') acc.notReturned++;
      return acc;
    },
    { returned: 0, notReturned: 0 }
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Almashtirishlar jurnali</h1>
            {total > 0 && (
              <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
                {total.toLocaleString('ru-RU')}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-400">Barcha batareya almashtirish tarixi</p>
        </div>
        <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#D1F22D] px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90">
          <Download className="h-4 w-4" />
          Eksport
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Jami"         value={total}              icon={Activity}       iconBg="bg-blue-600"    />
        <StatCard label="Qaytarildi"   value={counts.returned}    icon={ArrowDownToLine} iconBg="bg-emerald-600" />
        <StatCard label="Qaytarilmadi" value={counts.notReturned} icon={ArrowUpFromLine} iconBg="bg-orange-500"  />
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        {/* Card heading */}
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-base font-semibold text-white">Almashtirish jadvali</h2>
        </div>

        {/* Search toolbar */}
        <div className="border-b border-dark-border px-6 py-4">
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={rawSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Ism yoki telefon..."
              className="w-full rounded-xl border border-gray-700 bg-gray-900/60 py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[960px] px-6 py-4">
            {/* Header */}
            <div className="flex items-center gap-4 rounded-xl bg-gray-800/40 px-4 py-3">
              {HEADERS.map(([label, cls]) => (
                <div key={label} className={`${cls} text-xs font-semibold uppercase tracking-wider text-gray-400`}>
                  {label}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="mt-2 overflow-hidden rounded-xl bg-gray-900/20">
              {loading ? (
                <SkeletonRows />
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <AlertCircle className="h-10 w-10 text-red-500/60" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-red-400">{error}</p>
                </div>
              ) : swaps.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-600">
                  Almashtirishlar topilmadi
                </div>
              ) : (
                swaps.map((swap) => <DataRow key={swap.guid} swap={swap} />)
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {!loading && !error && (
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </div>
    </div>
  );
}
