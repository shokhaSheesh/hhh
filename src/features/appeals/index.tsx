import { useState } from 'react';
import {
  Search, Download, SlidersHorizontal,
  ChevronLeft, ChevronRight, ChevronDown,
  AlertCircle, FileText, FolderOpen, CheckCircle,
  Check, X,
} from 'lucide-react';
import { useAppeals, updateAppealStatus } from './hooks/useAppeals';
import { useDebounce } from '@/hooks/useDebounce';
import { AppealModal } from './components/AppealModal';
import type { Appeal } from '@/types/appeals';

const PAGE_SIZE = 15;

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(d);
  } catch { return iso; }
}

function shortId(guid: string) {
  return guid.slice(-6).toUpperCase();
}

// ─── Status config ────────────────────────────────────────────────────────────

// UI selector keys (what the dropdown value holds)
type UiStatus = 'YANGI' | 'BAJARILDI' | 'RAD_ETILDI';

// Maps UI keys → strict backend slugs
const STATUS_MAP: Record<UiStatus, string> = {
  YANGI:      'new',
  BAJARILDI:  'solved',
  RAD_ETILDI: 'ignored',
};

// Maps backend slugs → display config (for reading GET responses)
const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  new:     { label: 'Yangi',      cls: 'border-blue-500/20 bg-blue-500/10 text-blue-400'       },
  solved:  { label: 'Bajarildi',  cls: 'border-green-500/20 bg-green-500/10 text-green-400'    },
  ignored: { label: "Rad etildi", cls: 'border-red-500/20 bg-red-500/10 text-red-400'          },
};

const STATUS_OPTIONS: { value: UiStatus; label: string }[] = [
  { value: 'YANGI',      label: 'Yangi'      },
  { value: 'BAJARILDI',  label: 'Bajarildi'  },
  { value: 'RAD_ETILDI', label: "Rad etildi" },
];

// Convert backend slug → UI key for the dropdown initial value
function toUiStatus(backendSlug: string): UiStatus {
  const map: Record<string, UiStatus> = {
    new:     'YANGI',
    solved:  'BAJARILDI',
    ignored: 'RAD_ETILDI',
  };
  return map[backendSlug] ?? 'YANGI';
}

function getStatusCls(uiStatus: UiStatus): string {
  const backendSlug = STATUS_MAP[uiStatus] ?? 'new';
  return STATUS_LABELS[backendSlug]?.cls ?? STATUS_LABELS['new'].cls;
}

// ─── Status dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({
  value,
  onChange,
}: {
  value: UiStatus;
  onChange: (v: UiStatus) => void;
}) {
  return (
    <div
      className="relative inline-flex"
      onClick={(e) => e.stopPropagation()}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as UiStatus)}
        className={`appearance-none cursor-pointer rounded-full border py-0.5 pl-2.5 pr-6 text-xs font-medium outline-none transition-colors ${getStatusCls(value)}`}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-gray-900 text-white">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; type: 'success' | 'error'; message: string; }

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl ${
            t.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {t.type === 'success'
            ? <Check className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, iconBg,
}: { label: string; value: number | string; icon: React.ElementType; iconBg: string }) {
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

// ─── Row ─────────────────────────────────────────────────────────────────────

const COL = {
  id:     'w-24 shrink-0',
  user:   'w-48 shrink-0',
  msg:    'flex-1 min-w-0',
  status: 'w-36 shrink-0',
  time:   'w-40 shrink-0',
} as const;

function DataRow({
  appeal,
  localStatus,
  onClick,
  onStatusChange,
}: {
  appeal:         Appeal;
  localStatus:    UiStatus;
  onClick:        () => void;
  onStatusChange: (guid: string, status: UiStatus) => void;
}) {
  return (
    <div
      role="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-6 border-b border-dark-border px-4 py-4 transition-colors hover:bg-white/[0.04]"
    >
      <span className={`${COL.id} font-mono text-sm font-semibold text-white`}>
        {shortId(appeal.guid)}
      </span>
      <div className={`${COL.user} min-w-0`}>
        <p className="truncate text-sm font-semibold capitalize text-white">
          {appeal.name.toLowerCase()}
        </p>
        <p className="font-mono text-xs text-gray-500">{appeal.phone}</p>
      </div>
      <p className={`${COL.msg} truncate text-sm text-gray-300`}>
        {appeal.description}
      </p>
      <div className={COL.status}>
        <StatusDropdown
          value={localStatus}
          onChange={(v) => onStatusChange(appeal.guid, v)}
        />
      </div>
      <span className={`${COL.time} font-mono text-xs text-gray-400`}>
        {fmtDate(appeal.created_at)}
      </span>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-b border-dark-border px-4 py-4">
          <div className={`${COL.id} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.user} space-y-1.5`}>
            <div className="h-4 w-32 animate-pulse rounded bg-gray-800" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-800" />
          </div>
          <div className={`${COL.msg} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.status} h-6 w-24 animate-pulse rounded-full bg-gray-800`} />
          <div className={`${COL.time} h-4 animate-pulse rounded bg-gray-800`} />
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
        {from}–{to} / {total.toLocaleString('ru-RU')} murojaat
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

// ─── Table header row ─────────────────────────────────────────────────────────

const HEADERS: [string, string][] = [
  ['ID',            COL.id],
  ['Foydalanuvchi', COL.user],
  ['Xabar',         COL.msg],
  ['Holati',        COL.status],
  ['Vaqti',         COL.time],
];

// ─── Page ─────────────────────────────────────────────────────────────────────

let _toastId = 0;

export default function AppealsPage() {
  const [page,           setPage]          = useState(1);
  const [rawSearch,      setRawSearch]     = useState('');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [tick,           setTick]          = useState(0);
  const [localStatuses,  setLocalStatuses] = useState<Record<string, UiStatus>>({});
  const [toasts,         setToasts]        = useState<Toast[]>([]);
  const search = useDebounce(rawSearch, 400);

  const handleSearch = (v: string) => { setRawSearch(v); setPage(1); };

  const { appeals, total, loading, error } = useAppeals({ page, limit: PAGE_SIZE, search, tick });

  function addToast(type: Toast['type'], message: string) {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function getEffectiveStatus(appeal: Appeal): UiStatus {
    return localStatuses[appeal.guid] ?? toUiStatus(appeal.status[0] ?? 'new');
  }

  async function handleStatusChange(guid: string, newStatus: UiStatus) {
    const appeal = appeals.find((a) => a.guid === guid);
    if (!appeal) return;

    const prev = getEffectiveStatus(appeal);
    setLocalStatuses((s) => ({ ...s, [guid]: newStatus }));

    try {
      await updateAppealStatus(appeal, newStatus);
      addToast('success', "Murojaat holati muvaffaqiyatli o'zgartirildi!");
      setTick((t) => t + 1);
    } catch (err) {
      setLocalStatuses((s) => ({ ...s, [guid]: prev }));
      addToast('error', err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  }

  // Compute status counts from current page (indicative)
  const counts = appeals.reduce(
    (acc, a) => {
      const s = a.status[0] ?? 'new';
      if (s === 'new')           acc.open++;
      else if (s === 'solved')   acc.inProgress++;
      else if (s === 'ignored')  acc.closed++;
      return acc;
    },
    { open: 0, inProgress: 0, closed: 0 }
  );

  return (
    <>
      <ToastList toasts={toasts} onDismiss={dismissToast} />

      {selectedAppeal && (
        <AppealModal
          appeal={selectedAppeal}
          onClose={() => setSelectedAppeal(null)}
          onSuccess={() => setTick((t) => t + 1)}
        />
      )}

      <div className="space-y-5">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Murojaatlar</h1>
              {total > 0 && (
                <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
                  {total.toLocaleString('ru-RU')}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-400">Foydalanuvchilarning murojaatlari va so'rovlari</p>
          </div>
          <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#D1F22D] px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90">
            <Download className="h-4 w-4" />
            Eksport
          </button>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Jami"       value={total}             icon={FileText}    iconBg="bg-blue-600"    />
          <StatCard label="Yangi"      value={counts.open}       icon={FolderOpen}  iconBg="bg-orange-500"  />
          <StatCard label="Bajarildi"  value={counts.inProgress} icon={CheckCircle} iconBg="bg-emerald-600" />
          <StatCard label="Rad etildi" value={counts.closed}     icon={X}           iconBg="bg-red-600"     />
        </div>

        {/* ── Table card ──────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
          {/* Card heading */}
          <div className="border-b border-dark-border px-6 py-4">
            <h2 className="text-base font-semibold text-white">Murojaatlar jadvali</h2>
          </div>

          {/* Filter toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-border px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={rawSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Ism yoki telefon..."
                  className="w-64 rounded-xl border border-gray-700 bg-gray-900/60 py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-500"
                />
              </div>
              <button className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-600">
                Holati
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
              <SlidersHorizontal className="h-4 w-4" />
              Filtrlash
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[820px] px-6 py-4">
              {/* Header */}
              <div className="flex items-center gap-6 rounded-xl bg-gray-800/40 px-4 py-3">
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
                ) : appeals.length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-600">
                    Murojaatlar topilmadi
                  </div>
                ) : (
                  appeals.map((appeal) => (
                    <DataRow
                      key={appeal.guid}
                      appeal={appeal}
                      localStatus={getEffectiveStatus(appeal)}
                      onClick={() => setSelectedAppeal(appeal)}
                      onStatusChange={handleStatusChange}
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
