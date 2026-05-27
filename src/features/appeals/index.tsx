import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Download,
  ChevronLeft, ChevronRight, ChevronDown,
  AlertCircle, FileText, FolderOpen, CheckCircle,
  Check, X,
} from 'lucide-react';
import { FilterDropdown } from '@/components/FilterDropdown';
import { useAppeals, updateAppealStatus } from './hooks/useAppeals';
import { useDebounce } from '@/hooks/useDebounce';
import { AppealModal } from './components/AppealModal';
import type { Appeal } from '@/types/appeals';

const PAGE_SIZE = 15;

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return '—';
  try {
    const utc = /Z|[+-]\d\d:\d\d$/.test(iso) ? iso : iso + 'Z';
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Tashkent',
    }).format(new Date(utc));
  } catch { return iso; }
}

function shortId(guid: string) {
  return guid.slice(-6).toUpperCase();
}

// ─── Status config ────────────────────────────────────────────────────────────

// UI selector keys (what the dropdown value holds)
type UiStatus = 'YANGI' | 'BAJARILDI' | 'RAD_ETILDI';

const STATUS_OPTIONS: { value: UiStatus; label: string; badgeCls: string; dot: string }[] = [
  { value: 'YANGI',      label: 'Yangi',      badgeCls: 'border-Color-Info-Info bg-Color-Info-Info-Soft text-Color-Info-Info',                              dot: 'bg-Color-Info-Info'            },
  { value: 'BAJARILDI',  label: 'Bajarildi',  badgeCls: 'border-Color-Success-Success bg-Color-Success-Success-Soft text-Color-Success-Success',             dot: 'bg-Color-Success-Success'      },
  { value: 'RAD_ETILDI', label: 'Rad etildi', badgeCls: 'border-Color-Danger-Danger-Accent bg-Color-Danger-Danger-Soft text-Color-Danger-Danger-Accent',    dot: 'bg-Color-Danger-Danger-Accent' },
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

// ─── Status dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({ value, onChange }: { value: UiStatus; onChange: (v: UiStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const current = STATUS_OPTIONS.find((o) => o.value === value) ?? STATUS_OPTIONS[0];

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

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
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
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${current.badgeCls}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
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
              onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-Color-Grey-Grey-50 ${
                opt.value === value ? opt.badgeCls.split(' ').find(c => c.startsWith('text-')) + ' font-semibold' : 'text-Color-Grey-Grey-700'
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${opt.dot}`} />
              {opt.label}
              {opt.value === value && <Check className="ml-auto h-3.5 w-3.5" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
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
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-red-300 bg-red-50 text-red-600'
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
      className="flex cursor-pointer items-center gap-6 border-b border-Color-Grey-Grey-200 px-4 py-4 transition-colors hover:bg-Color-Grey-Grey-50"
    >
      <span className={`${COL.id} font-mono text-sm font-semibold text-Color-Grey-Grey-950`}>
        {shortId(appeal.guid)}
      </span>
      <div className={`${COL.user} min-w-0`}>
        <p className="truncate text-sm font-semibold capitalize text-Color-Grey-Grey-950">
          {appeal.name.toLowerCase()}
        </p>
        <p className="font-mono text-xs text-Color-Grey-Grey-600">{appeal.phone}</p>
      </div>
      <p className={`${COL.msg} truncate text-sm text-Color-Grey-Grey-700`}>
        {appeal.description}
      </p>
      <div className={COL.status}>
        <StatusDropdown
          value={localStatus}
          onChange={(v) => onStatusChange(appeal.guid, v)}
        />
      </div>
      <span className={`${COL.time} font-mono text-xs text-Color-Grey-Grey-600`}>
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
        <div key={i} className="flex items-center gap-6 border-b border-Color-Grey-Grey-200 px-4 py-4">
          <div className={`${COL.id} h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.user} space-y-1.5`}>
            <div className="h-4 w-32 animate-pulse rounded bg-Color-Grey-Grey-200" />
            <div className="h-3 w-20 animate-pulse rounded bg-Color-Grey-Grey-200" />
          </div>
          <div className={`${COL.msg} h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.status} h-6 w-24 animate-pulse rounded-full bg-Color-Grey-Grey-200`} />
          <div className={`${COL.time} h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
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
        {from}–{to} / {total.toLocaleString('ru-RU')} murojaat
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1 text-xs text-Color-Grey-Grey-400">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p as number)}
              className={['h-7 min-w-[28px] rounded-lg px-2 text-xs font-medium transition-colors',
                p === page ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark' : 'text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-100',
              ].join(' ')}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === Math.ceil(total / pageSize)}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 disabled:cursor-not-allowed disabled:opacity-30">
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
  const [statusFilter,   setStatusFilter]  = useState<string | null>(null);
  const search = useDebounce(rawSearch, 400);

  const handleSearch = (v: string) => { setRawSearch(v); setPage(1); };

  const { appeals, total, loading, error } = useAppeals({ page, limit: PAGE_SIZE, search, status: statusFilter, tick });

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
              <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">Murojaatlar</h1>
              {total > 0 && (
                <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                  {total.toLocaleString('ru-RU')}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-Color-Grey-Grey-600">Foydalanuvchilarning murojaatlari va so'rovlari</p>
          </div>
          <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-5 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90">
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
        <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
          {/* Card heading */}
          <div className="border-b border-Color-Grey-Grey-200 px-6 py-4">
            <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Murojaatlar jadvali</h2>
          </div>

          {/* Filter toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-Color-Grey-Grey-200 px-6 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-Color-Grey-Grey-500" />
              <input
                type="text"
                value={rawSearch}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Ism yoki telefon..."
                className="w-64 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 py-2.5 pl-9 pr-4 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400"
              />
            </div>
            <FilterDropdown
              placeholder="Holati"
              options={[
                { value: 'new',     label: 'Yangi'      },
                { value: 'solved',  label: 'Bajarildi'  },
                { value: 'ignored', label: 'Rad etildi' },
              ]}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[820px] px-6 py-4">
              {/* Header */}
              <div className="flex items-center gap-6 rounded-xl bg-Color-Grey-Grey-50 px-4 py-3">
                {HEADERS.map(([label, cls]) => (
                  <div key={label} className={`${cls} text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Body */}
              <div className="mt-2 overflow-hidden rounded-xl bg-Color-Light-Light">
                {loading ? (
                  <SkeletonRows />
                ) : error ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <AlertCircle className="h-10 w-10 text-red-400" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-Color-Danger-Danger-Accent">{error}</p>
                  </div>
                ) : appeals.length === 0 ? (
                  <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">
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
