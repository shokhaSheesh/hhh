import { useState } from 'react';
import { Ticket, Plus, AlertCircle, Infinity, Pencil, Trash2, Check, X } from 'lucide-react';
import { deletePromocode } from './hooks/usePromocodes';
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
  actions: 'w-20  shrink-0',
} as const;

const HEADERS: [string, string][] = [
  ['#',           COL.num],
  ['Kod',         COL.key],
  ['Chegirma',    COL.disc],
  ['Foydalanish', COL.usage],
  ['Muddati',     COL.until],
  ['Holati',      COL.status],
  ['',            COL.actions],
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-dark-border px-4 py-4">
          <div className={`${COL.num}     h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.key}     h-6 animate-pulse rounded-lg bg-gray-800`} />
          <div className={`${COL.disc}    h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.usage}   h-8 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.until}   h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.status}  h-6 w-20 animate-pulse rounded-full bg-gray-800`} />
          <div className={`${COL.actions} h-7 animate-pulse rounded-xl bg-gray-800`} />
        </div>
      ))}
    </>
  );
}

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({ promo, index, onEdit, onDelete }: {
  promo: Promocode; index: number;
  onEdit: (p: Promocode) => void;
  onDelete: (p: Promocode) => void;
}) {
  const { canUpdate, canDelete } = usePermissions();

  return (
    <div className="flex items-center gap-4 border-b border-dark-border px-4 py-4 transition-colors hover:bg-white/[0.02]">
      <span className={`${COL.num} text-sm font-semibold text-gray-500`}>{index}</span>

      <div className={COL.key}>
        <span className="inline-flex items-center rounded-lg border border-brand-lime/25 bg-brand-lime/10 px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-brand-lime">
          {promo.key}
        </span>
      </div>

      <div className={COL.disc}>
        <DiscountCell amount={promo.amount} pct={promo.discount_percentage} />
      </div>

      <div className={COL.usage}>
        <UsageCell userCount={promo.user_count} perUser={promo.use_count_per_user} />
      </div>

      <div className={COL.until}>
        {promo.valid_until ? (
          <span className="text-sm text-gray-300">{promo.valid_until}</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-gray-500">
            <Infinity className="h-3.5 w-3.5" /> Muddatsiz
          </span>
        )}
      </div>

      <div className={COL.status}>
        <StatusBadge active={promo.status} />
      </div>

      <div className={`${COL.actions} flex items-center gap-1.5`}>
        {canUpdate('promocodes') && (
          <button type="button" title="Tahrirlash" onClick={() => onEdit(promo)}
            className="group/e rounded-xl border border-gray-700 bg-gray-800 p-1.5 transition-colors hover:border-brand-lime hover:bg-brand-lime">
            <Pencil className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover/e:text-black" />
          </button>
        )}
        {canDelete('promocodes') && (
          <button type="button" title="O'chirish" onClick={() => onDelete(promo)}
            className="group/d rounded-xl border border-gray-700 bg-gray-800 p-1.5 transition-colors hover:border-red-500/50 hover:bg-red-500/10">
            <Trash2 className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover/d:text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromocodesPage() {
  const { canWrite } = usePermissions();
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<Promocode | null>(null);
  const [tick,        setTick]        = useState(0);
  const [confirmDel,  setConfirmDel]  = useState<Promocode | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const [toasts,      setToasts]      = useState<{ id: number; message: string; ok: boolean }[]>([]);
  const { promocodes, total, loading, error } = usePromocodes(tick);

  let _tid = 0;
  function pushToast(message: string, ok: boolean) {
    const id = ++_tid;
    setToasts((p) => [...p, { id, message, ok }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }

  async function handleDeleteConfirm() {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await deletePromocode(confirmDel.guid);
      setConfirmDel(null);
      setTick((n) => n + 1);
      pushToast("Promokod muvaffaqiyatli o'chirildi!", true);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "O'chirishda xatolik", false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Toasts */}
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

      {/* Delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDel(null)} aria-hidden />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-dark-border bg-dark-surface p-6 shadow-2xl">
            <p className="text-sm font-semibold text-white">Promokodni o'chirishni tasdiqlang</p>
            <p className="mt-1 text-xs text-gray-400">
              <span className="font-mono text-gray-300">{confirmDel.key}</span> promokodi o'chiriladi.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmDel(null)}
                className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5">
                Bekor qilish
              </button>
              <button onClick={handleDeleteConfirm} disabled={deleting}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">
                {deleting ? "O'chirilmoqda…" : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <DataRow
                    key={p.guid}
                    promo={p}
                    index={i + 1}
                    onEdit={(p) => setEditTarget(p)}
                    onDelete={(p) => setConfirmDel(p)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {modalOpen && (
      <PromocodeModal
        onClose={() => setModalOpen(false)}
        onSuccess={() => setTick((n) => n + 1)}
      />
    )}
    {editTarget && (
      <PromocodeModal
        initial={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => setTick((n) => n + 1)}
      />
    )}
    </>
  );
}
