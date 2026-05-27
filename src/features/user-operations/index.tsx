import { useState, useRef, useEffect } from 'react';
import {
  ArrowRightLeft, ChevronLeft, ChevronRight, AlertCircle, Check, X, Minus,
  TrendingDown, TrendingUp,
} from 'lucide-react';
import { useUserOperations } from './hooks/useUserOperations';
import { usePermissions } from '@/hooks/usePermissions';
import UserFilter, { type UserOption } from '@/components/UserFilter';
import { FilterDropdown } from '@/components/FilterDropdown';
import { createApi, VIEW } from '@/api/client';
import type { UserOperation, UserOperationsListResponse } from '@/types/userOperations';

// ─── Stat card ────────────────────────────────────────────────────────────────

const opsApi = createApi(VIEW.userOperations);
const VIEW_ID = '2746c785-91eb-4afd-8624-ad80215e7e38';

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

function useOpCounts() {
  const [withdrawCount, setWithdrawCount] = useState<number | null>(null);
  const [depositCount,  setDepositCount]  = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    const base = { row_view_id: VIEW_ID, offset: 0, limit: 1, order: {}, view_fields: [] };
    Promise.all([
      opsApi.post<UserOperationsListResponse>('/user_operations/items/list', { data: { ...base, type: ['withdraw'] } }),
      opsApi.post<UserOperationsListResponse>('/user_operations/items/list', { data: { ...base, type: ['deposit']  } }),
    ]).then(([a, b]) => {
      if (cancelled) return;
      setWithdrawCount(a.data.data.count ?? 0);
      setDepositCount(b.data.data.count ?? 0);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return { withdrawCount, depositCount };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    const utc = /Z|[+-]\d\d:\d\d$/.test(iso) ? iso : iso + 'Z';
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Tashkent',
    }).format(new Date(utc));
  } catch { return iso; }
}

function fmtAmount(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ─── Nullable name cell ───────────────────────────────────────────────────────

function NameCell({ value }: { value: string | null | undefined }) {
  if (!value) return <Minus className="h-3.5 w-3.5 text-Color-Grey-Grey-400" />;
  return <span className="text-sm text-Color-Grey-Grey-700">{value}</span>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; ok: boolean; }

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);
  const push = (message: string, ok: boolean) => {
    const id = next.current++;
    setToasts((t) => [...t, { id, message, ok }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };
  return { toasts, push };
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            t.ok
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-red-300 bg-red-50 text-red-600'
          }`}
        >
          {t.ok ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Column widths ────────────────────────────────────────────────────────────

const COL = {
  num:          'w-10  shrink-0',
  user:         'w-44  shrink-0',
  type:         'w-28  shrink-0',
  amount:       'w-36  shrink-0',
  subscription: 'w-40  shrink-0',
  penalty:      'w-28  shrink-0',
  coupon:       'w-28  shrink-0',
  promocode:    'w-32  shrink-0',
  date:         'flex-1 min-w-[140px]',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-4 py-4">
          <div className={`${COL.num}          h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.user}         h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.type}         h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.amount}       h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.subscription} h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.penalty}      h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.coupon}       h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.promocode}    h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.date}         h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
        </div>
      ))}
    </>
  );
}

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({
  op, rowNum, tariffNames,
}: {
  op: UserOperation;
  rowNum: number;
  tariffNames: Record<string, string>;
}) {
  const user = op.users_id_data;

  const subscriptionName = (() => {
    const sub = op.subscriptions_id_data;
    if (!sub) return null;
    const tariffId = sub.tariffs_id;
    if (tariffId && tariffNames[tariffId]) return tariffNames[tariffId];
    return null;
  })();

  const penaltyLabel = (() => {
    const p = op.penalties_id_data;
    if (!p) return null;
    return (p.name ?? p.description ?? null) as string | null;
  })();

  const couponLabel = (() => {
    const c = op.coupons_id_data;
    if (!c) return null;
    return (c.name ?? c.code ?? c.title ?? null) as string | null;
  })();

  const promocodeLabel = op.promocodes_id_data?.key ?? null;

  const opType = Array.isArray(op.type) ? op.type[0] : (op.type as string | null);

  const TYPE_LABELS: Record<string, string> = {
    withdraw: "Yechib olish",
    deposit:  "Hisobni to'ldirish",
  };
  const opTypeLabel = opType ? (TYPE_LABELS[opType.toLowerCase()] ?? opType) : '—';

  return (
    <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-4 py-3.5 transition-colors hover:bg-Color-Grey-Grey-50">
      <span className={`${COL.num} text-sm font-semibold text-Color-Grey-Grey-500`}>{rowNum}</span>

      <div className={`${COL.user} flex items-center gap-2 min-w-0`}>
        {user ? (
          <>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-Color-Primary-Primary/10 text-[10px] font-bold text-Color-Primary-Primary">
              {initials(user.name || '?')}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-Color-Grey-Grey-950">{user.name || '—'}</p>
              <p className="truncate font-mono text-xs text-Color-Grey-Grey-600">{user.phone || '—'}</p>
            </div>
          </>
        ) : (
          <span className="text-sm text-Color-Grey-Grey-500">—</span>
        )}
      </div>

      <span className={`${COL.type} truncate text-sm text-Color-Grey-Grey-700`}>{opTypeLabel}</span>

      <span className={`${COL.amount} font-mono text-sm font-semibold text-Color-Grey-Grey-950`}>
        {fmtAmount(op.amount)}
      </span>

      <div className={`${COL.subscription} flex items-center min-w-0`}>
        <NameCell value={subscriptionName} />
      </div>

      <div className={`${COL.penalty} flex items-center min-w-0`}>
        <NameCell value={penaltyLabel} />
      </div>

      <div className={`${COL.coupon} flex items-center min-w-0`}>
        <NameCell value={couponLabel} />
      </div>

      <div className={`${COL.promocode} flex items-center min-w-0`}>
        {promocodeLabel
          ? <span className="rounded-md border border-Color-Primary-Primary/30 bg-Color-Primary-Primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-Color-Primary-Primary">{promocodeLabel}</span>
          : <Minus className="h-3.5 w-3.5 text-Color-Grey-Grey-400" />}
      </div>

      <span className={`${COL.date} text-sm text-Color-Grey-Grey-600`}>{fmtDate(op.created_at)}</span>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between gap-4 border-t border-Color-Grey-Grey-200 px-4 py-3">
      <span className="text-xs text-Color-Grey-Grey-600">{total.toLocaleString('ru-RU')} ta natija</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-50 disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) => (
          p === '…'
            ? <span key={`e${i}`} className="px-1 text-xs text-Color-Grey-Grey-500">…</span>
            : <button key={p} onClick={() => onChange(p as number)}
                className={`min-w-[28px] rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                  p === page ? 'bg-Color-Primary-Primary text-Color-Dark-Constant-Dark' : 'text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-50'
                }`}>
                {p}
              </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-600 hover:bg-Color-Grey-Grey-50 disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserOperationsPage() {
  const { canRead } = usePermissions();
  const { toasts }  = useToasts();

  const [page,     setPage]     = useState(1);
  const [userId,   setUserId]   = useState<string | undefined>(undefined);
  const [opType,   setOpType]   = useState<string | null>(null);

  const handleUserSelect = (u: UserOption | null) => { setUserId(u?.guid); setPage(1); };

  const { operations, tariffNames, total, loading, error } = useUserOperations({ page, userId, opType });
  const { withdrawCount, depositCount } = useOpCounts();

  if (!canRead('user_operations')) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-Color-Grey-Grey-400" />
        <p className="text-sm font-medium text-Color-Grey-Grey-600">
          Sizda ushbu sahifani ko&apos;rish huquqi yo&apos;q
        </p>
      </div>
    );
  }

  return (
    <>
      <ToastStack toasts={toasts} />

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-Color-Primary-Primary/10">
              <ArrowRightLeft className="h-5 w-5 text-Color-Primary-Primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">Foydalanuvchi operatsiyalari</h1>
                {total > 0 && (
                  <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                    {total.toLocaleString('ru-RU')}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Barcha foydalanuvchi moliyaviy operatsiyalari</p>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Jami"           value={total}         icon={ArrowRightLeft} iconBg="bg-blue-600"    />
          <StatCard label="Yechib olish"   value={withdrawCount} icon={TrendingDown}   iconBg="bg-orange-500"  />
          <StatCard label="Hisobni to'ldirish" value={depositCount} icon={TrendingUp}  iconBg="bg-emerald-600" />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
          {/* Filter toolbar */}
          <div className="flex items-center gap-3 border-b border-Color-Grey-Grey-200 px-4 py-4">
            <UserFilter onSelect={handleUserSelect} />
            <FilterDropdown
              placeholder="Tur"
              options={[
                { value: 'withdraw', label: "Yechib olish"     },
                { value: 'deposit',  label: "Hisobni to'ldirish" },
              ]}
              value={opType}
              onChange={(v) => { setOpType(v); setPage(1); }}
            />
          </div>

          {/* Scrollable table area */}
          <div className="overflow-x-auto">
            {/* Header */}
            <div className="flex min-w-max items-center gap-4 border-b border-Color-Grey-Grey-200 px-4 py-3">
              <span className={`${COL.num}          text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>#</span>
              <span className={`${COL.user}         text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>Foydalanuvchi</span>
              <span className={`${COL.type}         text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>Tur</span>
              <span className={`${COL.amount}       text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>Summa</span>
              <span className={`${COL.subscription} text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>Obuna tarifi</span>
              <span className={`${COL.penalty}      text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>Jarima</span>
              <span className={`${COL.coupon}       text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>Kupon</span>
              <span className={`${COL.promocode}    text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>Promokod</span>
              <span className={`${COL.date}         text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>Sana</span>
            </div>

            {/* Body */}
            {error ? (
              <div className="flex items-center gap-3 px-4 py-8 text-Color-Danger-Danger-Accent">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            ) : loading ? (
              <SkeletonRows />
            ) : operations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-Color-Grey-Grey-500">
                <ArrowRightLeft className="h-8 w-8" />
                <p className="text-sm">Operatsiyalar topilmadi</p>
              </div>
            ) : (
              operations.map((op, i) => (
                <DataRow
                  key={op.guid}
                  op={op}
                  rowNum={(page - 1) * PAGE_SIZE + i + 1}
                  tariffNames={tariffNames}
                />
              ))
            )}
          </div>

          {/* Pagination — outside scroll area so it stays fixed to the card */}
          {!loading && !error && total > 0 && (
            <Pagination page={page} total={total} onChange={(p) => { setPage(p); window.scrollTo(0, 0); }} />
          )}
        </div>
      </div>
    </>
  );
}
