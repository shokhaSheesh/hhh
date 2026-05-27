import { useState } from 'react';
import {
  Search, Download, ChevronLeft, ChevronRight,
  AlertCircle, MapPin, Wifi, WifiOff, Battery,
} from 'lucide-react';
import { useStations } from './hooks/useStations';
import { useDebounce } from '@/hooks/useDebounce';
import StationDetailModal from './components/StationDetailModal';
import { FilterDropdown } from '@/components/FilterDropdown';
import type { Station, OnlineStatus } from '@/types/stations';

const PAGE_SIZE = 15;

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<OnlineStatus, { label: string; cls: string; dot: string }> = {
  online:  { label: 'Online',  cls: 'border-Color-Success-Success bg-Color-Success-Success-Soft text-Color-Success-Success', dot: 'bg-Color-Success-Success' },
  offline: { label: 'Offline', cls: 'border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 text-Color-Grey-Grey-600',            dot: 'bg-Color-Grey-Grey-400'  },
};

function StatusBadge({ status }: { status: OnlineStatus[] }) {
  const key = (status[0] ?? 'offline') as OnlineStatus;
  const { label, cls, dot } = STATUS_MAP[key] ?? STATUS_MAP.offline;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─── Slot pill ────────────────────────────────────────────────────────────────

function SlotPill({ value, color }: { value: number; color: string }) {
  return (
    <span className={`inline-flex h-6 min-w-[28px] items-center justify-center rounded-lg px-2 text-xs font-semibold ${color}`}>
      {value}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconBg }: {
  label: string; value: number | string; icon: React.ElementType; iconBg: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-4">
      <div>
        <p className="text-sm text-Color-Grey-Grey-600">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-Color-Grey-Grey-950">{value} ta</p>
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}

// ─── Column widths ────────────────────────────────────────────────────────────

const COL = {
  code:    'w-24 shrink-0',
  name:    'w-44 shrink-0',
  address: 'flex-1 min-w-0',
  city:    'w-32 shrink-0',
  status:  'w-28 shrink-0',
  empty:   'w-20 shrink-0 text-center',
  avail:   'w-20 shrink-0 text-center',
  disabled:'w-20 shrink-0 text-center',
} as const;

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({ station, onClick }: { station: Station; onClick: () => void }) {
  const name    = station.device_name    || '—';
  const address = station.device_location || station.address || '—';
  const city    = station.city           || '—';

  return (
    <div
      className="flex cursor-pointer items-center gap-4 border-b border-Color-Grey-Grey-200 px-4 py-4 transition-colors hover:bg-Color-Grey-Grey-50"
      onClick={onClick}
    >
      <span className={`${COL.code} font-mono text-xs font-semibold text-Color-Primary-Primary`}>
        {station.device_code}
      </span>

      <div className={`${COL.name} min-w-0`}>
        <p className="truncate text-sm font-semibold text-Color-Grey-Grey-950">{name}</p>
        {station.device_name_cyrillic && station.device_name_cyrillic !== name && (
          <p className="truncate text-xs text-Color-Grey-Grey-500">{station.device_name_cyrillic}</p>
        )}
      </div>

      <div className={`${COL.address} min-w-0`}>
        <p className="truncate text-sm text-Color-Grey-Grey-700">{address}</p>
      </div>

      <div className={`${COL.city} min-w-0`}>
        <p className="truncate text-sm text-Color-Grey-Grey-600">{city}</p>
      </div>

      <div className={COL.status}>
        <StatusBadge status={station.online_status} />
      </div>

      <div className={COL.empty}>
        <SlotPill value={station.empty_number}   color="bg-Color-Info-Info-Soft text-Color-Info-Info"    />
      </div>
      <div className={COL.avail}>
        <SlotPill value={station.may_number}     color="bg-Color-Success-Success-Soft text-Color-Success-Success" />
      </div>
      <div className={COL.disabled}>
        <SlotPill value={station.disable_number} color={station.disable_number > 0 ? 'bg-Color-Danger-Danger-Soft text-Color-Danger-Danger-Accent' : 'bg-Color-Grey-Grey-100 text-Color-Grey-Grey-500'} />
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
          <div className={`${COL.code}     h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.name}     h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.address}  h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.city}     h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.status}   h-6 w-20 animate-pulse rounded-full bg-Color-Grey-Grey-200`} />
          <div className={`${COL.empty}    h-6 w-8  animate-pulse rounded-lg   bg-Color-Grey-Grey-200`} />
          <div className={`${COL.avail}    h-6 w-8  animate-pulse rounded-lg   bg-Color-Grey-Grey-200`} />
          <div className={`${COL.disabled} h-6 w-8  animate-pulse rounded-lg   bg-Color-Grey-Grey-200`} />
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
        {from}–{to} / {total.toLocaleString('ru-RU')} stansiya
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
        <button onClick={() => onChange(page + 1)} disabled={page === Math.ceil(total / pageSize)}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-50 disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Table headers ────────────────────────────────────────────────────────────

const HEADERS: [string, string][] = [
  ['Kod',        COL.code],
  ['Stansiya',   COL.name],
  ['Manzil',     COL.address],
  ['Shahar',     COL.city],
  ['Holati',     COL.status],
  ['Bo\'sh',     COL.empty],
  ['Batareya',   COL.avail],
  ['O\'chirilgan', COL.disabled],
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StationsPage() {
  const [page,            setPage]           = useState(1);
  const [rawSearch,       setRawSearch]      = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [statusFilter,    setStatusFilter]   = useState<string | null>(null);
  const search = useDebounce(rawSearch, 400);

  const handleSearch = (v: string) => { setRawSearch(v); setPage(1); };

  const { stations, total, loading, error } = useStations({ page, limit: PAGE_SIZE, search, onlineStatus: statusFilter });

  const counts = stations.reduce(
    (acc, s) => {
      if (s.online_status[0] === 'online') acc.online++;
      else acc.offline++;
      return acc;
    },
    { online: 0, offline: 0 }
  );

  return (
    <>
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">Stansiyalar</h1>
            {total > 0 && (
              <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                {total.toLocaleString('ru-RU')}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-Color-Grey-Grey-600">Barcha batareya almashtirish stansiyalari</p>
        </div>
        <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-5 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90">
          <Download className="h-4 w-4" />
          Eksport
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Jami"    value={total}         icon={MapPin}  iconBg="bg-blue-600"    />
        <StatCard label="Online"  value={counts.online}  icon={Wifi}    iconBg="bg-emerald-600" />
        <StatCard label="Offline" value={counts.offline} icon={WifiOff} iconBg="bg-gray-600"    />
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        <div className="border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Stansiyalar jadvali</h2>
        </div>

        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-Color-Grey-Grey-500" />
            <input
              type="text"
              value={rawSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Stansiya nomi yoki manzil..."
              className="w-72 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 py-2.5 pl-9 pr-4 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400"
            />
          </div>
          <FilterDropdown
            placeholder="Holati"
            options={[
              { value: 'online',  label: 'Online'  },
              { value: 'offline', label: 'Offline' },
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[1020px] px-6 py-4">
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
              ) : stations.length === 0 ? (
                <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">
                  Stansiyalar topilmadi
                </div>
              ) : (
                stations.map((s) => (
                  <DataRow key={s.guid} station={s} onClick={() => setSelectedStation(s)} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {!loading && !error && (
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </div>

      {/* Legend */}
      {!loading && !error && stations.length > 0 && (
        <div className="flex items-center gap-6 px-1 text-xs text-Color-Grey-Grey-600">
          <div className="flex items-center gap-1.5">
            <Battery className="h-3.5 w-3.5 text-blue-400" />
            <span>Bo'sh — bo'sh slotlar soni</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Battery className="h-3.5 w-3.5 text-emerald-400" />
            <span>Batareya — tayyor batareyalar soni</span>
          </div>
        </div>
      )}
    </div>

    {selectedStation && (
      <StationDetailModal
        station={selectedStation}
        onClose={() => setSelectedStation(null)}
      />
    )}
  </>
  );
}
