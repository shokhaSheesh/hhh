import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Plus, AlertCircle, Infinity } from 'lucide-react';
import { usePromocodes } from './hooks/usePromocodes';
import PromocodeModal from './PromocodeModal';
import { usePermissions } from '@/hooks/usePermissions';
import type { Promocode } from '@/types/promocodes';

// ─── Discount cell ────────────────────────────────────────────────────────────

function DiscountCell({ amount, pct }: { amount: number | null; pct: number | null }) {
  if (pct != null && pct > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 px-2.5 py-1 text-sm font-semibold text-purple-400">
        {pct}%
      </span>
    );
  }
  if (amount != null) {
    return (
      <span className="text-sm font-semibold text-white">
        {amount.toLocaleString('ru-RU')} UZS
      </span>
    );
  }
  return <span className="text-sm text-gray-600">—</span>;
}

// ─── Usage cell ───────────────────────────────────────────────────────────────

function UsageCell({ userCount, perUser }: { userCount: number | null; perUser: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-white">
        {userCount == null ? (
          <span className="inline-flex items-center gap-1 text-brand-lime">
            <Infinity className="h-4 w-4" /> Cheksiz
          </span>
        ) : (
          <>{userCount.toLocaleString('ru-RU')} ta</>
        )}
      </span>
      <span className="text-xs text-gray-500">{perUser} marta / foydalanuvchi</span>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Faol
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-500">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
      Nofaol
    </span>
  );
}

// ─── Column widths ────────────────────────────────────────────────────────────

const COL = {
  num:     'w-8   shrink-0',
  key:     'w-44  shrink-0',
  disc:    'w-36  shrink-0',
  usage:   'flex-1 min-w-0',
  until:   'w-44  shrink-0',
  status:  'w-28  shrink-0',
} as const;

const HEADERS: [string, string][] = [
  ['#',          COL.num],
  ['Kod',        COL.key],
  ['Chegirma',   COL.disc],
  ['Foydalanish', COL.usage],
  ['Muddati',    COL.until],
  ['Holati',     COL.status],
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-dark-border px-4 py-4">
          <div className={`${COL.num}    h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.key}    h-6 animate-pulse rounded-lg bg-gray-800`} />
          <div className={`${COL.disc}   h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.usage}  h-8 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.until}  h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.status} h-6 w-20 animate-pulse rounded-full bg-gray-800`} />
        </div>
      ))}
    </>
  );
}

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({ promo, index, onClick }: { promo: Promocode; index: number; onClick: () => void }) {
  return (
    <div
      role="button" tabIndex={0}
      onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="flex cursor-pointer items-center gap-4 border-b border-dark-border px-4 py-4 transition-colors hover:bg-white/[0.04]"
    >
      <span className={`${COL.num} text-sm font-semibold text-gray-500`}>{index}</span>

      {/* Key badge */}
      <div className={COL.key}>
        <span className="inline-flex items-center rounded-lg border border-brand-lime/25 bg-brand-lime/10 px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-brand-lime">
          {promo.key}
        </span>
      </div>

      {/* Discount */}
      <div className={COL.disc}>
        <DiscountCell amount={promo.amount} pct={promo.discount_percentage} />
      </div>

      {/* Usage */}
      <div className={COL.usage}>
        <UsageCell userCount={promo.user_count} perUser={promo.use_count_per_user} />
      </div>

      {/* Valid until */}
      <div className={COL.until}>
        {promo.valid_until ? (
          <span className="text-sm text-gray-300">{promo.valid_until}</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-gray-500">
            <Infinity className="h-3.5 w-3.5" /> Muddatsiz
          </span>
        )}
      </div>

      {/* Status */}
      <div className={COL.status}>
        <StatusBadge active={promo.status} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromocodesPage() {
  const { canWrite } = usePermissions();
  const navigate    = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const { promocodes, total, loading, error } = usePromocodes();

  const openDetail = (p: Promocode) =>
    navigate(`/payments/promo-codes/${p.guid}`, { state: { promocode: p } });

  return (
    <>
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime/10">
            <Ticket className="h-5 w-5 text-brand-lime" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Promokodlar</h1>
              {total > 0 && (
                <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
                  {total}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-400">Chegirma kodlari va aksiyalar</p>
          </div>
        </div>

        {canWrite('promocodes') && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-lime px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Promokod qo'shish
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-base font-semibold text-white">Promokodlar jadvali</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-dark-border bg-gray-800/40 px-4 py-3">
              {HEADERS.map(([label, cls]) => (
                <div key={label} className={`${cls} text-xs font-semibold uppercase tracking-wider text-gray-400`}>
                  {label}
                </div>
              ))}
            </div>

            {/* Body */}
            <div>
              {loading ? (
                <SkeletonRows />
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <AlertCircle className="h-10 w-10 text-red-500/60" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-red-400">{error}</p>
                </div>
              ) : promocodes.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-600">
                  Promokod topilmadi
                </div>
              ) : (
                promocodes.map((p, i) => (
                  <DataRow key={p.guid} promo={p} index={i + 1} onClick={() => openDetail(p)} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {modalOpen && <PromocodeModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
