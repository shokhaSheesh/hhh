import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, ChevronLeft, ChevronRight,
  AlertCircle, Users, Newspaper,
} from 'lucide-react';
import { useNotifications } from './hooks/useNotifications';
import { usePermissions } from '@/hooks/usePermissions';
import UserFilter, { type UserOption } from '@/components/UserFilter';
import { NotificationModal } from './components/NotificationModal';
import { FilterDropdown } from '@/components/FilterDropdown';
import { createApi, VIEW } from '@/api/client';
import type { Notification, NotificationType, NotificationsListResponse } from '@/types/notifications';

const PAGE_SIZE = 20;

// ─── Stat card ────────────────────────────────────────────────────────────────

const notifApi = createApi(VIEW.notifications);

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

function useNotifCounts() {
  const [notifCount, setNotifCount] = useState<number | null>(null);
  const [newsCount,  setNewsCount]  = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      notifApi.post<NotificationsListResponse>('/notifications/items/list', { data: { offset: 0, limit: 1, type: ['notification'] } }),
      notifApi.post<NotificationsListResponse>('/notifications/items/list', { data: { offset: 0, limit: 1, type: ['news']         } }),
    ]).then(([a, b]) => {
      if (cancelled) return;
      setNotifCount(a.data.data.count ?? 0);
      setNewsCount(b.data.data.count ?? 0);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return { notifCount, newsCount };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function langs(n: Notification): string {
  const parts: string[] = [];
  if (n.title_uz || n.message_uz) parts.push('UZ');
  if (n.title_ru || n.message_ru) parts.push('RU');
  if (n.title_en || n.message_en) parts.push('EN');
  return parts.length ? parts.join(' / ') : '—';
}
// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  notification: { label: 'Bildirishnoma', cls: 'border-Color-Info-Info bg-Color-Info-Info-Soft text-Color-Info-Info' },
  news:         { label: 'Yangilik',      cls: 'border-purple-300 bg-purple-50 text-purple-700'                      },
};

function TypeBadge({ type }: { type: NotificationType[] }) {
  const key = type[0] ?? 'notification';
  const cfg = TYPE_CONFIG[key] ?? { label: key, cls: 'border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 text-Color-Grey-Grey-600' };
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
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-Color-Primary-Primary/10">
          <Users className="h-3.5 w-3.5 text-Color-Primary-Primary" />
        </div>
        <span className="text-sm font-semibold text-Color-Grey-Grey-950">Barchaga</span>
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
        <div className="hidden h-7 w-7 items-center justify-center rounded-full bg-Color-Grey-Grey-200 text-[10px] font-semibold text-Color-Grey-Grey-700">
          {initials}
        </div>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold capitalize text-Color-Grey-Grey-950">
          {u.name.toLowerCase()}
        </p>
        <p className="font-mono text-xs text-Color-Grey-Grey-600">{u.phone}</p>
      </div>
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

// BG tokens used for sticky cells (must be opaque)
const ROW_STICKY_BG  = 'bg-Color-Light-Light';
const HEAD_STICKY_BG = 'bg-Color-Grey-Grey-50';

function DataRow({ n, onClick }: { n: Notification; onClick: () => void }) {
  return (
    <div
      role="button"
      onClick={onClick}
      className="flex cursor-pointer items-start border-b border-Color-Grey-Grey-200 transition-colors hover:bg-Color-Grey-Grey-50"
    >
      {/* Sticky user cell */}
      <div className={`sticky left-0 z-10 w-52 shrink-0 border-r border-Color-Grey-Grey-200 py-3.5 pl-6 pr-4 ${ROW_STICKY_BG}`}>
        <UserCell n={n} />
      </div>

      {/* Title */}
      <div className="w-72 shrink-0 px-4 py-3.5 text-sm font-semibold text-Color-Grey-Grey-950">
        {n.title_uz ?? n.title_ru ?? n.title_en ?? '—'}
      </div>

      {/* Type */}
      <div className="w-36 shrink-0 px-4 py-3.5">
        <TypeBadge type={n.type} />
      </div>

      {/* Lang */}
      <div className="w-24 shrink-0 px-4 py-3.5 text-sm text-Color-Grey-Grey-600">
        {langs(n)}
      </div>

      {/* Message */}
      <div className="min-w-[360px] shrink-0 px-4 py-3.5 text-sm leading-relaxed text-Color-Grey-Grey-600 line-clamp-2">
        {n.message_uz ?? n.message_ru ?? n.message_en ?? '—'}
      </div>

      {/* Status */}
      <div className="w-32 shrink-0 px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-Color-Success-Success bg-Color-Success-Success-Soft px-2.5 py-0.5 text-xs font-medium text-Color-Success-Success">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Yuborilgan
        </span>
      </div>

      {/* Time */}
      <div className="w-36 shrink-0 px-4 py-3.5 font-mono text-xs text-Color-Grey-Grey-600">
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
        <div key={i} className="flex items-center border-b border-Color-Grey-Grey-200">
          <div className={`sticky left-0 z-10 w-52 shrink-0 border-r border-Color-Grey-Grey-200 py-4 pl-6 pr-4 ${ROW_STICKY_BG}`}>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 animate-pulse rounded-full bg-Color-Grey-Grey-200" />
              <div className="h-4 flex-1 animate-pulse rounded bg-Color-Grey-Grey-200" />
            </div>
          </div>
          <div className="w-72 shrink-0 px-4 py-4"><div className="h-4 animate-pulse rounded bg-Color-Grey-Grey-200" /></div>
          <div className="w-36 shrink-0 px-4 py-4"><div className="h-5 w-24 animate-pulse rounded-full bg-Color-Grey-Grey-200" /></div>
          <div className="w-24 shrink-0 px-4 py-4"><div className="h-4 animate-pulse rounded bg-Color-Grey-Grey-200" /></div>
          <div className="min-w-[360px] shrink-0 px-4 py-4"><div className="h-4 animate-pulse rounded bg-Color-Grey-Grey-200" /></div>
          <div className="w-32 shrink-0 px-4 py-4"><div className="h-5 w-24 animate-pulse rounded-full bg-Color-Grey-Grey-200" /></div>
          <div className="w-36 shrink-0 px-4 py-4"><div className="h-4 animate-pulse rounded bg-Color-Grey-Grey-200" /></div>
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
        {from}–{to} / {total.toLocaleString('ru-RU')} bildirishnoma
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
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 disabled:cursor-not-allowed disabled:opacity-30">
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
  const [page,       setPage]       = useState(1);
  const [userId,     setUserId]     = useState<string | undefined>(undefined);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const handleUserSelect = (u: UserOption | null) => { setUserId(u?.guid); setPage(1); };

  const { notifications, total, loading, error } = useNotifications({ page, limit: PAGE_SIZE, search: '', userId, typeFilter });
  const { notifCount, newsCount } = useNotifCounts();

  return (
    <>
      {modalOpen && <NotificationModal onClose={() => setModalOpen(false)} />}

      <div className="space-y-5">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">Bildirishnomalar</h1>
              {total > 0 && (
                <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                  {total.toLocaleString('ru-RU')}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-Color-Grey-Grey-600">Tizim va foydalanuvchi bildirishnomalari</p>
          </div>
          {canWrite('notifications') && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-5 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90"
            >
              <Bell className="h-4 w-4" />
              Xabar yuborish
            </button>
          )}
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Jami"          value={total}      icon={Bell}      iconBg="bg-blue-600"   />
          <StatCard label="Bildirishnoma" value={notifCount} icon={Bell}      iconBg="bg-purple-600" />
          <StatCard label="Yangilik"      value={newsCount}  icon={Newspaper} iconBg="bg-orange-500" />
        </div>

        {/* ── Table card (no overflow-hidden — needed for sticky column) ─── */}
        <div className="rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
          {/* Card heading */}
          <div className="border-b border-Color-Grey-Grey-200 px-6 py-4">
            <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Bildirishnomalar jadvali</h2>
          </div>

          {/* Filter toolbar */}
          <div className="flex items-center gap-3 border-b border-Color-Grey-Grey-200 px-6 py-4">
            <UserFilter onSelect={handleUserSelect} />
            <FilterDropdown
              placeholder="Turi"
              options={[
                { value: 'notification', label: 'Bildirishnoma' },
                { value: 'news',         label: 'Yangilik'      },
              ]}
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setPage(1); }}
            />
          </div>

          {/* Table — horizontally scrollable */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Header */}
              <div className="flex items-center bg-Color-Grey-Grey-50">
                <div className={`sticky left-0 z-20 w-52 shrink-0 border-r border-Color-Grey-Grey-200 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600 ${HEAD_STICKY_BG}`}>
                  Foydalanuvchi
                </div>
                <div className="w-72 shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Mavzu</div>
                <div className="w-36 shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Turi</div>
                <div className="w-24 shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Tili</div>
                <div className="min-w-[360px] shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Xabar</div>
                <div className="w-32 shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Holati</div>
                <div className="w-36 shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Vaqti</div>
              </div>

              {/* Body */}
              <div className="bg-Color-Light-Light">
                {loading ? (
                  <SkeletonRows />
                ) : error ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <AlertCircle className="h-10 w-10 text-red-400" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-Color-Danger-Danger-Accent">{error}</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">
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
