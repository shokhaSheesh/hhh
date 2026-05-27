import { useState, useRef } from 'react';
import { Tag, AlertCircle, Plus, Check, X, Pencil, Trash2 } from 'lucide-react';
import { useTariffs, deleteTariff } from './hooks/useTariffs';
import { TariffFormModal } from './components/TariffFormModal';
import { usePermissions } from '@/hooks/usePermissions';
import type { Tariff } from '@/types/tariffs';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; ok: boolean; }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-sm ${
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

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  function push(message: string, ok: boolean) {
    const id = ++counter.current;
    setToasts((p) => [...p, { id, message, ok }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }
  return { toasts, push };
}

// ─── Confirm delete modal ────────────────────────────────────────────────────

function ConfirmDeleteModal({
  tariff,
  onConfirm,
  onCancel,
  loading,
}: {
  tariff:    Tariff;
  onConfirm: () => void;
  onCancel:  () => void;
  loading:   boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-6 shadow-2xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-Color-Grey-Grey-950">Tarifni o'chirish</h3>
        <p className="mb-1 text-sm text-Color-Grey-Grey-600">
          <span className="font-semibold text-Color-Grey-Grey-900">{tariff.name}</span> tarifini o'chirmoqchimisiz?
        </p>
        <p className="mb-6 text-xs text-Color-Grey-Grey-500">Bu amalni qaytarib bo'lmaydi.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light py-2.5 text-sm font-medium text-Color-Grey-Grey-700 transition-colors hover:bg-Color-Grey-Grey-50 disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "O'chirilmoqda…" : "O'chirish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(amount: number) {
  return amount.toLocaleString('ru-RU') + ' UZS';
}

// ─── Base tariff badge ────────────────────────────────────────────────────────

function BaseBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-Color-Primary-Primary bg-Color-Primary-Primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-Color-Primary-Primary">
      Asosiy
    </span>
  );
}

// ─── Column widths ────────────────────────────────────────────────────────────

const COL = {
  num:     'w-8  shrink-0',
  name:    'flex-1 min-w-0',
  price:   'w-40 shrink-0',
  days:    'w-28 shrink-0',
  swaps:   'w-28 shrink-0',
  daily:   'w-28 shrink-0',
  limit:   'w-40 shrink-0',
  actions: 'w-20 shrink-0',
} as const;

const HEADERS: [string, string][] = [
  ['#',               COL.num],
  ['Tarif nomi',      COL.name],
  ['Narxi',           COL.price],
  ['Muddat',          COL.days],
  ['Almashtirishlar', COL.swaps],
  ['Kunlik limit',    COL.daily],
  ['Limit narxi',     COL.limit],
  ['',                COL.actions],
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-4 py-5">
          <div className={`${COL.num}     h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.name}    h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.price}   h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.days}    h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.swaps}   h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.daily}   h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.limit}   h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.actions} h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
        </div>
      ))}
    </>
  );
}

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({
  tariff, index, onEdit, onView, onDelete,
}: {
  tariff:    Tariff;
  index:     number;
  onEdit:    (t: Tariff) => void;
  onView:    (t: Tariff) => void;
  onDelete:  (t: Tariff) => void;
}) {
  const { canUpdate, canDelete } = usePermissions();
  const dayCount = tariff.tariff_types_id_data?.day_count;

  return (
    <div
      onClick={() => onView(tariff)}
      className="relative flex cursor-pointer items-center gap-4 border-b border-Color-Grey-Grey-200 py-5 pr-4 pl-4 transition-colors hover:bg-Color-Grey-Grey-50"
      style={{ borderLeft: `3px solid ${tariff.color}` }}
    >
      <span className={`${COL.num} text-sm font-semibold text-Color-Grey-Grey-500`}>{index}</span>

      <div className={`${COL.name} flex min-w-0 flex-col gap-1`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-Color-Grey-Grey-950">{tariff.name}</span>
          {tariff.base_tariff && <BaseBadge />}
        </div>
        <span
          className="inline-flex w-fit rounded px-1.5 py-0.5 font-mono text-[10px] font-medium"
          style={{ backgroundColor: tariff.color + '1A', color: tariff.color }}
        >
          {tariff.key}
        </span>
      </div>

      <div className={COL.price}>
        <span className="text-sm font-semibold text-Color-Grey-Grey-950">{fmtPrice(tariff.amount)}</span>
      </div>

      <div className={COL.days}>
        {dayCount != null ? (
          <span className="text-sm text-Color-Grey-Grey-700">{dayCount} kun</span>
        ) : (
          <span className="text-sm text-Color-Grey-Grey-500">—</span>
        )}
      </div>

      <div className={COL.swaps}>
        <span className="text-sm text-Color-Grey-Grey-700">{tariff.swap_count}</span>
      </div>

      <div className={COL.daily}>
        <span className="text-sm text-Color-Grey-Grey-700">{tariff.daily_swap_limit} / kun</span>
      </div>

      <div className={COL.limit}>
        <span className="text-sm text-Color-Grey-Grey-600">{fmtPrice(tariff.over_limit_amount)}</span>
      </div>

      <div className={`${COL.actions} flex items-center gap-1.5`}>
        {canUpdate('tariffs') && (
          <button
            type="button"
            title="Tahrirlash"
            onClick={(e) => { e.stopPropagation(); onEdit(tariff); }}
            className="group/edit rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 transition-colors hover:border-Color-Primary-Primary hover:bg-Color-Primary-Primary"
          >
            <Pencil className="h-3.5 w-3.5 text-Color-Grey-Grey-600 transition-colors group-hover/edit:text-Color-Dark-Constant-Dark" />
          </button>
        )}
        {canDelete('tariffs') && (
          <button
            type="button"
            title="O'chirish"
            onClick={(e) => { e.stopPropagation(); onDelete(tariff); }}
            className="group/del rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 transition-colors hover:border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5 text-Color-Grey-Grey-600 transition-colors group-hover/del:text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TariffsPage() {
  const { canWrite } = usePermissions();
  const [tick,         setTick]         = useState(0);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState<Tariff | null>(null);
  const [viewTarget,   setViewTarget]   = useState<Tariff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tariff | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const { toasts, push } = useToasts();

  const { tariffs, total, loading, error } = useTariffs(tick);

  function handleCreateSuccess() {
    setTick((n) => n + 1);
    push("Yangi tarif rejasi muvaffaqiyatli qo'shildi!", true);
  }

  function handleEditSuccess() {
    setTick((n) => n + 1);
    push('Tarif rejasi muvaffaqiyatli yangilandi!', true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTariff(deleteTarget.guid);
      setDeleteTarget(null);
      setTick((n) => n + 1);
      push(`"${deleteTarget.name}" tariflari o'chirildi.`, true);
    } catch {
      push("O'chirishda xatolik yuz berdi.", false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} />

      {createOpen && (
        <TariffFormModal
          onClose={() => setCreateOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {editTarget && (
        <TariffFormModal
          tariff={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {viewTarget && (
        <TariffFormModal
          tariff={viewTarget}
          viewOnly
          onClose={() => setViewTarget(null)}
          onSuccess={() => {}}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          tariff={deleteTarget}
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-Color-Primary-Primary/10">
            <Tag className="h-5 w-5 text-Color-Primary-Primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">Tariflar</h1>
              {total > 0 && (
                <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                  {total}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Obuna rejalari va narxlar</p>
          </div>
        </div>

        {canWrite('tariffs') && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-5 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Yangi tarif
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        <div className="border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Tariflar jadvali</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-3">
              {HEADERS.map(([label, cls]) => (
                <div key={label} className={`${cls} text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>
                  {label}
                </div>
              ))}
            </div>

            <div>
              {loading ? (
                <SkeletonRows />
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <AlertCircle className="h-10 w-10 text-Color-Danger-Danger-Accent" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-Color-Danger-Danger-Accent">{error}</p>
                </div>
              ) : tariffs.length === 0 ? (
                <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">
                  Tarif topilmadi
                </div>
              ) : (
                tariffs.map((t, i) => (
                  <DataRow
                    key={t.guid}
                    tariff={t}
                    index={i + 1}
                    onEdit={(t) => setEditTarget(t)}
                    onView={(t) => setViewTarget(t)}
                    onDelete={(t) => setDeleteTarget(t)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
