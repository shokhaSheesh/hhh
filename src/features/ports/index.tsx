import { useState } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, AlertCircle, Plug } from 'lucide-react';
import { usePorts } from './hooks/usePorts';
import { useDebounce } from '@/hooks/useDebounce';
import type { PortBinding } from '@/types/portBindings';

const PAGE_SIZE = 20;

// ─── SOC bar ──────────────────────────────────────────────────────────────────

function SocBar({ soc }: { soc: number }) {
  const [bgFill, bgTrack] =
    soc > 80  ? ['bg-emerald-500', 'bg-emerald-500/15']
    : soc >= 30 ? ['bg-yellow-500',  'bg-yellow-500/15']
    :             ['bg-red-500',     'bg-red-500/15'];

  return (
    <div className={`relative h-6 w-24 overflow-hidden rounded-lg ${bgTrack}`}>
      <div
        className={`absolute left-0 top-0 h-full rounded-lg ${bgFill}`}
        style={{ width: `${soc}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-sm">
        {soc}%
      </span>
    </div>
  );
}

// ─── Door status badge ────────────────────────────────────────────────────────

function DoorBadge({ open }: { open: boolean }) {
  return open ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-Color-Info-Info bg-Color-Info-Info-Soft px-2.5 py-0.5 text-xs font-medium text-Color-Info-Info">
      <span className="h-1.5 w-1.5 rounded-full bg-Color-Info-Info" />
      Ochiq
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-medium text-Color-Grey-Grey-600">
      <span className="h-1.5 w-1.5 rounded-full bg-Color-Grey-Grey-400" />
      Yopiq
    </span>
  );
}

// ─── Port status badge ────────────────────────────────────────────────────────

function PortBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-Color-Success-Success bg-Color-Success-Success-Soft px-2.5 py-0.5 text-xs font-medium text-Color-Success-Success">
      <span className="h-1.5 w-1.5 rounded-full bg-Color-Success-Success" />
      Faol
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-medium text-Color-Grey-Grey-600">
      <span className="h-1.5 w-1.5 rounded-full bg-Color-Grey-Grey-400" />
      Nofaol
    </span>
  );
}

// ─── Column widths ────────────────────────────────────────────────────────────

const COL = {
  num:     'w-8  shrink-0',
  station: 'w-40 shrink-0',
  port:    'w-16 shrink-0',
  sn:      'flex-1 min-w-0',
  soc:     'w-28 shrink-0',
  door:    'w-28 shrink-0',
  status:  'w-28 shrink-0',
} as const;

const HEADERS: [string, string][] = [
  ['#',            COL.num],
  ['Stansiya',     COL.station],
  ['Port',         COL.port],
  ['Batareya SN',  COL.sn],
  ['Quvvat',       COL.soc],
  ['Eshik holati', COL.door],
  ['Port holati',  COL.status],
];

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({ binding, index }: { binding: PortBinding; index: number }) {
  const device  = binding.devices_id_data;
  const battery = binding.batteries_id_data;

  return (
    <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-4 py-4 transition-colors hover:bg-Color-Grey-Grey-50">
      <span className={`${COL.num} text-sm font-semibold text-Color-Grey-Grey-600`}>{index}</span>

      {/* Station */}
      <div className={`${COL.station} min-w-0`}>
        <p className="truncate text-sm font-semibold text-Color-Grey-Grey-950">
          {device?.device_name || device?.device_code || '—'}
        </p>
        {device?.device_code && device?.device_name && (
          <p className="font-mono text-xs text-Color-Grey-Grey-500">{device.device_code}</p>
        )}
      </div>

      {/* Port number */}
      <div className={COL.port}>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-Color-Grey-Grey-100 text-xs font-bold text-Color-Grey-Grey-950">
          {binding.port}
        </span>
      </div>

      {/* Battery SN */}
      <div className={`${COL.sn} min-w-0`}>
        {battery ? (
          <span className="font-mono text-xs text-Color-Grey-Grey-700">{battery.battery_sn}</span>
        ) : (
          <span className="text-xs text-Color-Grey-Grey-500">Bo'sh</span>
        )}
      </div>

      {/* SOC bar */}
      <div className={COL.soc}>
        {battery ? (
          <SocBar soc={Math.min(100, Math.max(0, battery.soc ?? 0))} />
        ) : (
          <span className="text-xs text-Color-Grey-Grey-500">—</span>
        )}
      </div>

      {/* Door status */}
      <div className={COL.door}>
        <DoorBadge open={binding.door_status} />
      </div>

      {/* Port status */}
      <div className={COL.status}>
        <PortBadge active={binding.port_status} />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-4 py-4">
          <div className={`${COL.num}     h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.station} h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.port}    h-7 w-7 animate-pulse rounded-lg bg-Color-Grey-Grey-200`} />
          <div className={`${COL.sn}      h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.soc}     h-6 w-24 animate-pulse rounded-lg bg-Color-Grey-Grey-200`} />
          <div className={`${COL.door}    h-6 w-20 animate-pulse rounded-full bg-Color-Grey-Grey-200`} />
          <div className={`${COL.status}  h-6 w-20 animate-pulse rounded-full bg-Color-Grey-Grey-200`} />
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
    <div className="flex items-center justify-between border-t border-Color-Grey-Grey-200 px-6 py-4">
      <span className="text-xs text-Color-Grey-Grey-600">
        {from}–{to} / {total.toLocaleString('ru-RU')} port
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-50 disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1 text-xs text-Color-Grey-Grey-500">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p as number)}
              className={['h-7 min-w-[28px] rounded-lg px-2 text-xs font-medium transition-colors',
                p === page ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark' : 'text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-50',
              ].join(' ')}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-50 disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortsPage() {
  const [page,      setPage]      = useState(1);
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebounce(rawSearch, 400);

  const handleSearch = (v: string) => { setRawSearch(v); setPage(1); };

  const { ports, total, loading, error } = usePorts({ page, limit: PAGE_SIZE, search });

  const offset = (page - 1) * PAGE_SIZE;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-Color-Primary-Primary/10">
            <Plug className="h-5 w-5 text-Color-Primary-Primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">Qurilma portlari</h1>
              {total > 0 && (
                <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                  {total.toLocaleString('ru-RU')}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Barcha qurilma portlarining holati</p>
          </div>
        </div>
        <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-5 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90">
          <Download className="h-4 w-4" />
          Eksport
        </button>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        {/* Card heading */}
        <div className="border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Portlar jadvali</h2>
        </div>

        {/* Search toolbar */}
        <div className="border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div className="relative w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-Color-Grey-Grey-500" />
            <input
              type="text"
              value={rawSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Qurilma, batareya SN..."
              className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 py-2.5 pl-9 pr-4 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[860px] px-6 py-4">
            {/* Header row */}
            <div className="flex items-center gap-4 rounded-xl bg-Color-Grey-Grey-50 px-4 py-3">
              {HEADERS.map(([label, cls]) => (
                <div key={label} className={`${cls} text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>
                  {label}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="mt-2 overflow-hidden rounded-xl">
              {loading ? (
                <SkeletonRows />
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <AlertCircle className="h-10 w-10 text-Color-Danger-Danger-Accent" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-Color-Danger-Danger-Accent">{error}</p>
                </div>
              ) : ports.length === 0 ? (
                <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">
                  Port topilmadi
                </div>
              ) : (
                ports.map((p, i) => (
                  <DataRow key={p.guid || `${p.port}-${i}`} binding={p} index={offset + i + 1} />
                ))
              )}
            </div>
          </div>
        </div>

        {!loading && !error && (
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </div>
    </div>
  );
}
