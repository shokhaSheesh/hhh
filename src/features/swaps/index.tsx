import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Download, ChevronLeft, ChevronRight,
  AlertCircle, ArrowDownToLine, ArrowUpFromLine, Activity,
  Check, X, Loader2, ChevronDown, Copy,
} from 'lucide-react';
import { useSwaps, updateSwapStatus } from './hooks/useSwaps';
import UserFilter, { type UserOption } from '@/components/UserFilter';
import { FilterDropdown } from '@/components/FilterDropdown';
import type { SwapRecord, SwapStatus } from '@/types/swaps';

const PAGE_SIZE = 15;

// ─── Formatters ───────────────────────────────────────────────────────────────

function shortId(guid: string) {
  return guid.slice(-6).toUpperCase();
}

function fmtDate(raw: string) {
  if (!raw) return '—';
  try {
    // "DD.MM.YYYY HH:mm" pre-formatted UTC string from API → parse as UTC
    const pre = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
    if (pre) {
      const iso = `${pre[3]}-${pre[2]}-${pre[1]}T${pre[4]}:${pre[5]}:00Z`;
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Tashkent',
      }).format(new Date(iso));
    }
    // ISO format — force UTC if no timezone marker
    const utc = /Z|[+-]\d\d:\d\d$/.test(raw) ? raw : raw + 'Z';
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Tashkent',
    }).format(new Date(utc));
  } catch { return raw; }
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

// ─── Status dropdown ──────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: SwapStatus; label: string; cls: string; dot: string }[] = [
  { value: 'bound',   label: 'Qaytarildi',   cls: 'text-Color-Success-Success', dot: 'bg-Color-Success-Success' },
  { value: 'unbound', label: 'Qaytarilmadi', cls: 'text-Color-Warning-Warning',  dot: 'bg-Color-Warning-Warning'  },
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
            ? 'border-Color-Success-Success bg-Color-Success-Success-Soft text-Color-Success-Success'
            : 'border-Color-Warning-Warning bg-Color-Warning-Warning-Soft text-Color-Warning-Warning'
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
          className="overflow-hidden rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl"
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onSelect(opt.value); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-Color-Grey-Grey-50 ${
                opt.value === status ? opt.cls + ' font-semibold' : 'text-Color-Grey-Grey-700'
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
  id:        'w-20 shrink-0',
  user:      'w-48 shrink-0',
  battery:   'w-52 shrink-0',
  device:    'flex-1 min-w-[140px]',
  boundAt:   'w-36 shrink-0',
  unboundAt: 'w-36 shrink-0',
  status:    'w-36 shrink-0',
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
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex min-w-max items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4 transition-colors hover:bg-Color-Grey-Grey-50">
      <span className={`${COL.id} font-mono text-sm font-semibold text-Color-Grey-Grey-950`}>
        {shortId(swap.guid)}
      </span>

      {/* User */}
      <div className={`${COL.user} flex items-center gap-2.5 min-w-0`}>
        {user ? (
          <>
            {user.photo ? (
              <img src={user.photo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-Color-Grey-Grey-100 text-xs font-semibold text-Color-Grey-Grey-950">
                {user.name?.charAt(0) ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold capitalize text-Color-Grey-Grey-950">
                {user.name?.toLowerCase() ?? '—'}
              </p>
              <p className="font-mono text-xs text-Color-Grey-Grey-600">{user.phone ?? '—'}</p>
            </div>
          </>
        ) : (
          <span className="text-sm text-Color-Grey-Grey-500">—</span>
        )}
      </div>

      {/* Battery SN */}
      <div className={`${COL.battery} min-w-0`}>
        {batt ? (
          <>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(batt.battery_sn).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              })}
              title="Nusxalash"
              className="flex items-center gap-1.5 font-mono text-xs text-Color-Grey-Grey-700 hover:text-Color-Primary-Primary transition-colors text-left group"
            >
              {batt.battery_sn}
              {copied
                ? <Check className="h-3 w-3 shrink-0 text-Color-Success-Success" />
                : <Copy className="h-3 w-3 shrink-0 text-Color-Grey-Grey-400" />
              }
            </button>
            <p className="mt-0.5 text-xs text-Color-Grey-Grey-500">
              SOC:{' '}
              <span className="text-Color-Grey-Grey-600">
                {swap.unbound_battery_soc != null ? swap.unbound_battery_soc : batt.soc}%
              </span>
            </p>
          </>
        ) : (
          <span className="text-sm text-Color-Grey-Grey-500">—</span>
        )}
      </div>

      {/* Device name */}
      <div className={`${COL.device} min-w-0`}>
        <p className="truncate text-sm font-semibold text-Color-Grey-Grey-950">{device?.device_name ?? '—'}</p>
      </div>

      {/* Olindi (unbound_at) */}
      <span className={`${COL.unboundAt} font-mono text-xs text-Color-Grey-Grey-600`}>
        {fmtDate(swap.unbound_at)}
      </span>

      {/* Qaytarildi (bound_at) */}
      <span className={`${COL.boundAt} font-mono text-xs text-Color-Grey-Grey-600`}>
        {swap.bound_at ? fmtDate(swap.bound_at) : '—'}
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
        <div key={i} className="flex min-w-max items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div className={`${COL.id}      h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.user}    space-y-1.5`}>
            <div className="h-4 w-36 animate-pulse rounded bg-Color-Grey-Grey-200" />
            <div className="h-3 w-24 animate-pulse rounded bg-Color-Grey-Grey-200" />
          </div>
          <div className={`${COL.battery}   h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.device}    h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.boundAt}   h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.unboundAt} h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.status}  h-6 w-24 animate-pulse rounded-full bg-Color-Grey-Grey-200`} />
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
        {from}–{to} / {total.toLocaleString('ru-RU')} almashtirish
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

// ─── Table header ─────────────────────────────────────────────────────────────

const HEADERS: [string, string][] = [
  ['ID',            COL.id],
  ['Foydalanuvchi', COL.user],
  ['Batareya SN',   COL.battery],
  ['Qurilma nomi',  COL.device],
  ['Olindi',        COL.unboundAt],
  ['Qaytarildi',    COL.boundAt],
  ['Holati',        COL.status],
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SwapsPage() {
  const [page,         setPage]         = useState(1);
  const [userId,       setUserId]       = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [togglingId,   setTogglingId]   = useState<string | null>(null);
  const [toasts,       setToasts]       = useState<{ id: number; message: string; ok: boolean }[]>([]);

  const handleUserSelect = (u: UserOption | null) => { setUserId(u?.guid); setPage(1); };

  const { swaps, total, loading, error, refetch } = useSwaps({ page, limit: PAGE_SIZE, userId, statusFilter });

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
          <div key={t.id} className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl ${
            t.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                 : 'border-red-300 bg-red-50 text-red-600'
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
            <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">Almashtirishlar jurnali</h1>
            {total > 0 && (
              <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                {total.toLocaleString('ru-RU')}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-Color-Grey-Grey-600">Barcha batareya almashtirish tarixi</p>
        </div>
        <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-5 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90">
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
      <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        {/* Card heading */}
        <div className="border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Almashtirish jadvali</h2>
        </div>

        {/* Filter toolbar */}
        <div className="flex items-center gap-3 border-b border-Color-Grey-Grey-200 px-6 py-4">
          <UserFilter onSelect={handleUserSelect} />
          <FilterDropdown
            placeholder="Holati"
            options={[
              { value: 'bound',   label: 'Qaytarildi'   },
              { value: 'unbound', label: 'Qaytarilmadi' },
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="flex min-w-max items-center gap-4 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-6 py-3">
            {HEADERS.map(([label, cls]) => (
              <div key={label} className={`${cls} text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>
                {label}
              </div>
            ))}
          </div>

          {/* Body */}
          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-Color-Danger-Danger-Accent" strokeWidth={1.5} />
              <p className="text-sm font-medium text-Color-Danger-Danger-Accent">{error}</p>
            </div>
          ) : swaps.length === 0 ? (
            <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">
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

        {!loading && !error && (
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </div>
    </div>
    </>
  );
}