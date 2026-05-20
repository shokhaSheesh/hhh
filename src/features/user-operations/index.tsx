import { useState, useRef } from 'react';
import {
  ArrowRightLeft, Search, ChevronLeft, ChevronRight, AlertCircle, Check, X, Minus,
} from 'lucide-react';
import { useUserOperations } from './hooks/useUserOperations';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import type { UserOperation } from '@/types/userOperations';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
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
  if (!value) return <Minus className="h-3.5 w-3.5 text-gray-600" />;
  return <span className="text-sm text-gray-300">{value}</span>;
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
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-red-500/30   bg-red-500/10   text-red-400'
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
        <div key={i} className="flex items-center gap-4 border-b border-dark-border px-4 py-4">
          <div className={`${COL.num}          h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.user}         h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.type}         h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.amount}       h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.subscription} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.penalty}      h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.coupon}       h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.promocode}    h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.date}         h-4 animate-pulse rounded bg-gray-800`} />
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

  return (
    <div className="flex items-center gap-4 border-b border-dark-border px-4 py-3.5 transition-colors hover:bg-white/[0.03]">
      <span className={`${COL.num} text-sm font-semibold text-gray-500`}>{rowNum}</span>

      <div className={`${COL.user} flex items-center gap-2 min-w-0`}>
        {user ? (
          <>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-lime/20 text-[10px] font-bold text-brand-lime">
              {initials(user.name || '?')}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name || '—'}</p>
              <p className="truncate font-mono text-xs text-gray-500">{user.phone || '—'}</p>
            </div>
          </>
        ) : (
          <span className="text-sm text-gray-600">—</span>
        )}
      </div>

      <span className={`${COL.type} truncate text-sm text-gray-300`}>{opType || '—'}</span>

      <span className={`${COL.amount} font-mono text-sm font-semibold text-white`}>
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
          ? <span className="rounded-md border border-brand-lime/30 bg-brand-lime/10 px-2 py-0.5 font-mono text-xs font-semibold text-brand-lime">{promocodeLabel}</span>
          : <Minus className="h-3.5 w-3.5 text-gray-600" />}
      </div>

      <span className={`${COL.date} text-sm text-gray-400`}>{fmtDate(op.created_at)}</span>
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
    <div className="flex items-center justify-between gap-4 border-t border-dark-border px-4 py-3">
      <span className="text-xs text-gray-500">{total.toLocaleString('ru-RU')} ta natija</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) => (
          p === '…'
            ? <span key={`e${i}`} className="px-1 text-xs text-gray-600">…</span>
            : <button key={p} onClick={() => onChange(p as number)}
                className={`min-w-[28px] rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                  p === page ? 'bg-brand-lime text-black' : 'text-gray-400 hover:bg-white/5'
                }`}>
                {p}
              </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-white/5 disabled:opacity-30">
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

  const [page,      setPage]      = useState(1);
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebounce(rawSearch, 400);

  const { operations, tariffNames, total, loading, error } = useUserOperations({ page, search });

  if (!canRead('user_operations')) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-gray-600" />
        <p className="text-sm font-medium text-gray-400">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime/10">
              <ArrowRightLeft className="h-5 w-5 text-brand-lime" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-white">Foydalanuvchi operatsiyalari</h1>
                {total > 0 && (
                  <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
                    {total.toLocaleString('ru-RU')}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-gray-400">Barcha foydalanuvchi moliyaviy operatsiyalari</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={rawSearch}
              onChange={(e) => { setRawSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-gray-700 bg-gray-900/60 py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-dark-border bg-dark-surface">
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-dark-border px-4 py-3">
            <span className={`${COL.num}          text-xs font-semibold uppercase tracking-wider text-gray-500`}>#</span>
            <span className={`${COL.user}         text-xs font-semibold uppercase tracking-wider text-gray-500`}>Foydalanuvchi</span>
            <span className={`${COL.type}         text-xs font-semibold uppercase tracking-wider text-gray-500`}>Tur</span>
            <span className={`${COL.amount}       text-xs font-semibold uppercase tracking-wider text-gray-500`}>Summa</span>
            <span className={`${COL.subscription} text-xs font-semibold uppercase tracking-wider text-gray-500`}>Obuna tarifi</span>
            <span className={`${COL.penalty}      text-xs font-semibold uppercase tracking-wider text-gray-500`}>Jarima</span>
            <span className={`${COL.coupon}       text-xs font-semibold uppercase tracking-wider text-gray-500`}>Kupon</span>
            <span className={`${COL.promocode}    text-xs font-semibold uppercase tracking-wider text-gray-500`}>Promokod</span>
            <span className={`${COL.date}         text-xs font-semibold uppercase tracking-wider text-gray-500`}>Sana</span>
          </div>

          {/* Body */}
          {error ? (
            <div className="flex items-center gap-3 px-4 py-8 text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          ) : loading ? (
            <SkeletonRows />
          ) : operations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-600">
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

          {/* Pagination */}
          {!loading && !error && total > 0 && (
            <Pagination page={page} total={total} onChange={(p) => { setPage(p); window.scrollTo(0, 0); }} />
          )}
        </div>
      </div>
    </>
  );
}
