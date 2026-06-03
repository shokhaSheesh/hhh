import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, CalendarCheck, CheckCircle, XCircle } from 'lucide-react';
import { useSubscriptions } from './hooks/useSubscriptions';
import UserFilter, { type UserOption } from '@/components/UserFilter';
import { createApi, VIEW } from '@/api/client';
import type { Subscription, SubscriptionsListResponse } from '@/types/subscriptions';

const subApi = createApi(VIEW.subscriptions);

const LIMIT = 20;

// ─── Stat card ────────────────────────────────────────────────────────────────

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

// ─── Sub counts hook ──────────────────────────────────────────────────────────

function useSubCounts() {
  const [activeCount,   setActiveCount]   = useState<number | null>(null);
  const [inactiveCount, setInactiveCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      subApi.post<SubscriptionsListResponse>('/subscriptions/items/list', { data: { offset: 0, limit: 1, active: true  } }),
      subApi.post<SubscriptionsListResponse>('/subscriptions/items/list', { data: { offset: 0, limit: 1, active: false } }),
    ]).then(([a, b]) => {
      if (cancelled) return;
      setActiveCount(a.data?.data?.count ?? 0);
      setInactiveCount(b.data?.data?.count ?? 0);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return { activeCount, inactiveCount };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  if (/^\d{2}\.\d{2}\.\d{4}/.test(iso)) return iso.split(' ')[0];
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(iso));
  } catch { return iso; }
}

function fmtAmount(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n) + " so'm";
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-Color-Success-Success bg-Color-Success-Success-Soft px-2.5 py-0.5 text-xs font-medium text-Color-Success-Success">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Faol
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-medium text-Color-Grey-Grey-600">
      <span className="h-1.5 w-1.5 rounded-full bg-Color-Grey-Grey-400" />
      Nofaol
    </span>
  );
}

// ─── Data row ─────────────────────────────────────────────────────────────────

function SubRow({ sub }: { sub: Subscription }) {
  const user = sub.users_id_data;

  return (
    <div className="flex min-w-max items-center gap-0 border-b border-Color-Grey-Grey-200 last:border-0 transition-colors hover:bg-Color-Grey-Grey-50">

      {/* User — sticky left */}
      <div className="sticky left-0 z-10 w-56 shrink-0 border-r border-Color-Grey-Grey-200 bg-Color-Light-Light py-3 pl-6 pr-4">
        {user ? (
          <div className="flex items-center gap-2.5">
            {user.photo ? (
              <img
                src={user.photo}
                alt={user.name}
                className="h-8 w-8 shrink-0 rounded-xl object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-Color-Primary-Primary/10 text-xs font-bold text-Color-Primary-Primary"
              style={{ display: user.photo ? undefined : 'flex' }}
            >
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium capitalize text-Color-Grey-Grey-950">
                {user.name.toLowerCase()}
              </p>
              <p className="font-mono text-xs text-Color-Grey-Grey-600">{user.phone}</p>
            </div>
          </div>
        ) : (
          <span className="font-mono text-xs text-Color-Grey-Grey-500">{sub.users_id.slice(0, 8)}…</span>
        )}
      </div>

      {/* Holati */}
      <div className="w-28 shrink-0 px-4 py-3">
        <ActiveBadge active={sub.active} />
      </div>

      {/* Tarif nomi */}
      <div className="w-44 shrink-0 px-4 py-3">
        <span className="inline-flex items-center rounded-md border border-Color-Warning-Warning bg-Color-Warning-Warning-Soft px-2.5 py-0.5 text-xs font-semibold text-Color-Warning-Warning">
          {sub.tariffs_id_data?.name ?? '—'}
        </span>
      </div>

      {/* Summa */}
      <div className="w-36 shrink-0 px-4 py-3">
        <span className="text-sm font-semibold text-Color-Grey-Grey-950">{fmtAmount(sub.final_amount)}</span>
      </div>

      {/* Almashtirishlar */}
      <div className="w-36 shrink-0 px-4 py-3 text-center">
        <span className="text-sm text-Color-Grey-Grey-700">
          {sub.used_swap_count != null ? sub.used_swap_count : '—'}
        </span>
      </div>

      {/* Boshlanish */}
      <div className="w-36 shrink-0 px-4 py-3">
        <span className="font-mono text-xs text-Color-Grey-Grey-600">{fmtDate(sub.active_from)}</span>
      </div>

      {/* Tugash */}
      <div className="w-36 shrink-0 px-4 py-3">
        {sub.active_to ? (
          <span className="font-mono text-xs text-Color-Grey-Grey-600">{fmtDate(sub.active_to)}</span>
        ) : (
          <span className="text-xs text-Color-Grey-Grey-500">Cheksiz</span>
        )}
      </div>

      {/* Yaratilgan */}
      <div className="w-36 shrink-0 px-4 py-3">
        <span className="font-mono text-xs text-Color-Grey-Grey-600">{fmtDate(sub.created_at)}</span>
      </div>

    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: LIMIT }).map((_, i) => (
        <div key={i} className="flex min-w-max items-center gap-0 border-b border-Color-Grey-Grey-200 py-3">
          <div className="sticky left-0 w-56 shrink-0 border-r border-Color-Grey-Grey-200 bg-Color-Light-Light px-6 py-0.5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-xl bg-Color-Grey-Grey-200" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 animate-pulse rounded bg-Color-Grey-Grey-200" />
                <div className="h-3 w-20 animate-pulse rounded bg-Color-Grey-Grey-200" />
              </div>
            </div>
          </div>
          {[28, 36, 36, 36, 36, 36].map((w, j) => (
            <div key={j} className={`w-${w} shrink-0 px-4`}>
              <div className="h-4 w-20 animate-pulse rounded bg-Color-Grey-Grey-200" />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const COLS = [
  { label: 'Foydalanuvchi',  w: 'w-56', sticky: true  },
  { label: 'Holati',         w: 'w-28', sticky: false },
  { label: 'Tarif',          w: 'w-44', sticky: false },
  { label: 'Summa',          w: 'w-36', sticky: false },
  { label: 'Almashtirishlar',w: 'w-36', sticky: false },
  { label: 'Boshlandi',      w: 'w-36', sticky: false },
  { label: 'Tugaydi',        w: 'w-36', sticky: false },
  { label: 'Yaratildi',      w: 'w-36', sticky: false },
];

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

export default function SubscriptionsPage() {
  const [page,   setPage]   = useState(1);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const handleUserSelect = (u: UserOption | null) => { setUserId(u?.guid); setPage(1); };

  const { subscriptions, total, loading, error } = useSubscriptions({ page, limit: LIMIT, userId });
  const { activeCount, inactiveCount } = useSubCounts();


  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-Color-Grey-Grey-950">Obunalar</h1>
        <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Barcha foydalanuvchi obunalari</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Jami"   value={total}         icon={CalendarCheck} iconBg="bg-blue-600"    />
        <StatCard label="Faol"   value={activeCount}   icon={CheckCircle}   iconBg="bg-emerald-600" />
        <StatCard label="Nofaol" value={inactiveCount} icon={XCircle}       iconBg="bg-red-500"     />
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        {/* Toolbar */}
        <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-Color-Grey-Grey-950">
            Obunalar jadvali
            {total > 0 && (
              <span className="ml-2 rounded-full bg-Color-Grey-Grey-100 px-2 py-0.5 text-xs font-normal text-Color-Grey-Grey-600">
                {total.toLocaleString('ru-RU')}
              </span>
            )}
          </h2>
          <UserFilter onSelect={handleUserSelect} />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-6 py-4 text-sm text-Color-Danger-Danger-Accent">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {/* Header row */}
          <div className="flex min-w-max items-center gap-0 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50">
            {COLS.map(({ label, w, sticky }) => (
              <div
                key={label}
                className={[
                  w, 'shrink-0 px-4 py-3',
                  sticky ? 'sticky left-0 z-20 border-r border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 pl-6' : '',
                ].join(' ')}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Body */}
          {loading ? (
            <SkeletonRows />
          ) : subscriptions.length === 0 ? (
            <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">Obunalar topilmadi</div>
          ) : (
            subscriptions.map((sub) => <SubRow key={sub.guid} sub={sub} />)
          )}
        </div>

        {!loading && <Pagination page={page} total={total} limit={LIMIT} label="ta obuna" onChange={setPage} />}
      </div>
    </div>
  );
}
