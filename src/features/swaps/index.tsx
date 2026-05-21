import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Download, ChevronLeft, ChevronRight,
  AlertCircle, ArrowDownToLine, ArrowUpFromLine, Activity,
  Check, X, Loader2, ChevronDown,
} from 'lucide-react';
import { useSwaps, updateSwapStatus } from './hooks/useSwaps';
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

// ─── Status dropdown ──────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: SwapStatus; label: string; cls: string; dot: string }[] = [
  { value: 'bound',   label: 'Qaytarildi',   cls: 'text-emerald-400', dot: 'bg-emerald-400' },
  { value: 'unbound', label: 'Qaytarilmadi', cls: 'text-orange-400',  dot: 'bg-orange-400'  },
];

function StatusDropdown({ status, onSelect, loading }: {
  status:   SwapStatus;
  onSelect: (v: SwapStatus) => void;
  loading:  boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const current = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[1];

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (listRef.current && !listRef.current.contains(t)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function handleOpen() {
    if (loading) return;
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 160) });
    }
    setOpen((v) => !v);
  }

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 ${
          status === 'bound'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-orange-500/30 bg-orange-500/10 text-orange-400'
        }`}
      >
        {loading
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />}
        {current.label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div
          ref={listRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="overflow-hidden rounded-xl border border-dark-border bg-[#1c1c26] shadow-2xl"
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onSelect(opt.value); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.04] ${
                opt.value === status ? opt.cls + ' font-semibold' : 'text-gray-300'
              }`}
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dot}`} />
              {opt.label}
              {opt.value === status && <Check className="ml-auto h-3.5 w-3.5" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
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
  status:  'w-36 shrink-0',
} as const;

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({ swap, onToggle, toggling }: {
  swap:     SwapRecord;
  onToggle: (swap: SwapRecord, newStatus: SwapStatus) => void;
  toggling: boolean;
}) {
  const user   = swap.users_id_data   ?? null;
  const device = swap.devices_id_data ?? null;
  const batt   = swap.batteries_id_data ?? null;
  const status = (swap.status[0] ?? 'unbound') as SwapStatus;

  return (
    <div className="flex items-center gap-4 border-b border-dark-border px-4 py-4 transition-colors hover:bg-white/[0.04]">
      <span className={`${COL.id} font-mono text-sm font-semibold text-white`}>
        {shortId(swap.guid)}
      </span>

      {/* User */}
      <div className={`${COL.user} flex items-center gap-2.5 min-w-0`}>
        {user ? (
          <>
            {user.photo ? (
              <img src={user.photo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-white">
                {user.name?.charAt(0) ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold capitalize text-white">
                {user.name?.toLowerCase() ?? '—'}
              </p>
              <p className="font-mono text-xs text-gray-500">{user.phone ?? '—'}</p>
            </div>
          </>
        ) : (
          <span className="text-sm text-gray-600">—</span>
        )}
      </div>

      {/* Battery SN */}
      <div className={`${COL.battery} min-w-0`}>
        {batt ? (
          <>
            <p className="truncate font-mono text-xs text-gray-300">{batt.battery_sn}</p>
            <p className="mt-0.5 text-xs text-gray-600">
              SOC: <span className="text-gray-400">{batt.soc}%</span>
            </p>
          </>
        ) : (
          <span className="text-sm text-gray-600">—</span>
        )}
      </div>

      {/* Device name */}
      <div className={`${COL.device} min-w-0`}>
        <p className="truncate text-sm font-semibold text-white">{device?.device_name ?? '—'}</p>
      </div>

      {/* Station address */}
      <div className={`${COL.station} min-w-0`}>
        <p className="truncate text-sm text-gray-300">{device?.device_location || device?.address || '—'}</p>
      </div>

      {/* Time */}
      <span className={`${COL.time} font-mono text-xs text-gray-400`}>
        {fmtDate(swap.unbound_at)}
      </span>

      {/* Status dropdown */}
      <div className={COL.status}>
        <StatusDropdown
          status={status}
          onSelect={(v) => onToggle(swap, v)}
          loading={toggling}
        />
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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; ok: boolean }[]>([]);
  const search = useDebounce(rawSearch, 400);

  const handleSearch = (v: string) => { setRawSearch(v); setPage(1); };

  const { swaps, total, loading, error, refetch } = useSwaps({ page, limit: PAGE_SIZE, search });

  let _tid = 0;
  function pushToast(message: string, ok: boolean) {
    const id = ++_tid;
    setToasts((p) => [...p, { id, message, ok }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }

  async function handleToggle(swap: SwapRecord, newStatus: SwapStatus) {
    setTogglingId(swap.guid);
    try {
      await updateSwapStatus(swap, newStatus);
      refetch();
      pushToast(
        newStatus === 'bound' ? 'Qaytarildi deb belgilandi' : 'Qaytarilmadi deb belgilandi',
        true,
      );
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Xatolik yuz berdi', false);
    } finally {
      setTogglingId(null);
    }
  }

  const counts = swaps.reduce(
    (acc, s) => {
      if (s.status[0] === 'bound')   acc.returned++;
      else if (s.status[0] === 'unbound') acc.notReturned++;
      return acc;
    },
    { returned: 0, notReturned: 0 }
  );

  return (
    <>
    {toasts.length > 0 && (
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-sm ${
            t.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                 : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}>
            {t.ok ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>
    )}
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
                swaps.map((swap) => (
                  <DataRow
                    key={swap.guid}
                    swap={swap}
                    onToggle={handleToggle}
                    toggling={togglingId === swap.guid}
                  />
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
    </div>
    </>
  );
}
