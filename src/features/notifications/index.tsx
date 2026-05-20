import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, ChevronLeft, ChevronRight,
  AlertCircle, Users,
} from 'lucide-react';
import { useNotifications } from './hooks/useNotifications';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import { NotificationModal } from './components/NotificationModal';
import type { Notification, NotificationType } from '@/types/notifications';

const PAGE_SIZE = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

function langs(n: Notification): string {
  const parts: string[] = [];
  if (n.title_uz || n.message_uz) parts.push('UZ');
  if (n.title_ru || n.message_ru) parts.push('RU');
  if (n.title_en || n.message_en) parts.push('EN');
  return parts.length ? parts.join(' / ') : '—';
}

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  notification: { label: 'Bildirishnoma', cls: 'border-blue-500/30 bg-blue-500/10 text-blue-400'       },
  news:         { label: 'Yangilik',      cls: 'border-purple-500/30 bg-purple-500/10 text-purple-400' },
};

function TypeBadge({ type }: { type: NotificationType[] }) {
  const key = type[0] ?? 'notification';
  const cfg = TYPE_CONFIG[key] ?? { label: key, cls: 'border-gray-700 bg-gray-800 text-gray-400' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── User cell ────────────────────────────────────────────────────────────────

function UserCell({ n }: { n: Notification }) {
  if (!n.users_id || !n.users_id_data) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-lime/10">
          <Users className="h-3.5 w-3.5 text-brand-lime" />
        </div>
        <span className="text-sm font-semibold text-brand-lime">Barchaga</span>
      </div>
    );
  }
  const u        = n.users_id_data;
  const initials = u.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-7 w-7 shrink-0">
        <img
          src={u.photo}
          alt={u.name}
          className="h-7 w-7 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
            if (fb) fb.style.display = 'flex';
          }}
        />
        <div className="hidden h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-[10px] font-semibold text-gray-300">
          {initials}
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold capitalize text-white">
          {u.name.toLowerCase()}
        </p>
        <p className="font-mono text-xs text-gray-500">{u.phone}</p>
      </div>
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

// BG tokens used for sticky cells (must be opaque)
const ROW_STICKY_BG  = 'bg-[#16161D]';  // = dark-surface
const HEAD_STICKY_BG = 'bg-[#1c1f29]';  // approximates gray-800/40 on dark-surface

function DataRow({ n, onClick }: { n: Notification; onClick: () => void }) {
  return (
    <div
      role="button"
      onClick={onClick}
      className="flex cursor-pointer items-start border-b border-dark-border transition-colors hover:bg-white/[0.03]"
    >
      {/* Sticky user cell */}
      <div className={`sticky left-0 z-10 w-52 shrink-0 border-r border-gray-800/60 py-3.5 pl-6 pr-4 ${ROW_STICKY_BG}`}>
        <UserCell n={n} />
      </div>

      {/* Title */}
      <div className="w-72 shrink-0 px-4 py-3.5 text-sm font-semibold text-white">
        {n.title_uz ?? n.title_ru ?? n.title_en ?? '—'}
      </div>

      {/* Type */}
      <div className="w-36 shrink-0 px-4 py-3.5">
        <TypeBadge type={n.type} />
      </div>

      {/* Lang */}
      <div className="w-24 shrink-0 px-4 py-3.5 text-sm text-gray-400">
        {langs(n)}
      </div>

      {/* Message */}
      <div className="min-w-[360px] shrink-0 px-4 py-3.5 text-sm leading-relaxed text-gray-400 line-clamp-2">
        {n.message_uz ?? n.message_ru ?? n.message_en ?? '—'}
      </div>

      {/* Status */}
      <div className="w-32 shrink-0 px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Yuborilgan
        </span>
      </div>

      {/* Time */}
      <div className="w-36 shrink-0 px-4 py-3.5 font-mono text-xs text-gray-400">
        {fmtDate(n.created_at)}
      </div>

    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="flex items-center border-b border-dark-border">
          <div className={`sticky left-0 z-10 w-52 shrink-0 border-r border-gray-800/60 py-4 pl-6 pr-4 ${ROW_STICKY_BG}`}>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 animate-pulse rounded-full bg-gray-800" />
              <div className="h-4 flex-1 animate-pulse rounded bg-gray-800" />
            </div>
          </div>
          <div className="w-72 shrink-0 px-4 py-4"><div className="h-4 animate-pulse rounded bg-gray-800" /></div>
          <div className="w-36 shrink-0 px-4 py-4"><div className="h-5 w-24 animate-pulse rounded-full bg-gray-800" /></div>
          <div className="w-24 shrink-0 px-4 py-4"><div className="h-4 animate-pulse rounded bg-gray-800" /></div>
          <div className="min-w-[360px] shrink-0 px-4 py-4"><div className="h-4 animate-pulse rounded bg-gray-800" /></div>
          <div className="w-32 shrink-0 px-4 py-4"><div className="h-5 w-24 animate-pulse rounded-full bg-gray-800" /></div>
          <div className="w-36 shrink-0 px-4 py-4"><div className="h-4 animate-pulse rounded bg-gray-800" /></div>
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
        {from}–{to} / {total.toLocaleString('ru-RU')} bildirishnoma
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
                p === page ? 'bg-brand-lime text-black' : 'text-gray-400 hover:bg-white/5',
              ].join(' ')}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { canWrite } = usePermissions();
  const navigate    = useNavigate();
  const [page,      setPage]      = useState(1);
  const [rawSearch, setRawSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const search = useDebounce(rawSearch, 400);

  const handleSearch = (v: string) => { setRawSearch(v); setPage(1); };

  const { notifications, total, loading, error } = useNotifications({ page, limit: PAGE_SIZE, search });

  return (
    <>
      {modalOpen && <NotificationModal onClose={() => setModalOpen(false)} />}

      <div className="space-y-5">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Bildirishnomalar</h1>
              {total > 0 && (
                <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
                  {total.toLocaleString('ru-RU')}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-400">Tizim va foydalanuvchi bildirishnomalari</p>
          </div>
          {canWrite('notifications') && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-lime px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              <Bell className="h-4 w-4" />
              Xabar yuborish
            </button>
          )}
        </div>

        {/* ── Table card (no overflow-hidden — needed for sticky column) ─── */}
        <div className="rounded-2xl border border-dark-border bg-dark-surface">
          {/* Card heading */}
          <div className="border-b border-dark-border px-6 py-4">
            <h2 className="text-base font-semibold text-white">Bildirishnomalar jadvali</h2>
          </div>

          {/* Filter toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-dark-border px-6 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={rawSearch}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Sarlavha bo'yicha qidirish..."
                className="w-72 rounded-xl border border-gray-700 bg-gray-900/60 py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-500"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-600">
              Bildirishnoma turi
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Table — horizontally scrollable */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Header */}
              <div className="flex items-center bg-gray-800/40">
                <div className={`sticky left-0 z-20 w-52 shrink-0 border-r border-gray-800/60 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 ${HEAD_STICKY_BG}`}>
                  Foydalanuvchi
                </div>
                <div className="w-72 shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Mavzu</div>
                <div className="w-36 shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Turi</div>
                <div className="w-24 shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Tili</div>
                <div className="min-w-[360px] shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Xabar</div>
                <div className="w-32 shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Holati</div>
                <div className="w-36 shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Vaqti</div>
              </div>

              {/* Body */}
              <div className="bg-gray-900/20">
                {loading ? (
                  <SkeletonRows />
                ) : error ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <AlertCircle className="h-10 w-10 text-red-500/60" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-red-400">{error}</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-600">
                    Bildirishnomalar topilmadi
                  </div>
                ) : (
                  notifications.map((n) => (
                    <DataRow
                      key={n.guid}
                      n={n}
                      onClick={() => navigate(`/notifications/${n.guid}`, { state: { notification: n } })}
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
