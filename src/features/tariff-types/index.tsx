import { useState, useRef } from 'react';
import { Layers, AlertCircle, Plus, Check, X, Trash2 } from 'lucide-react';
import { useTariffTypes, deleteTariffType } from '@/features/tariffs/hooks/useTariffs';
import { DeleteConfirmModal } from '@/features/users/components/DeleteConfirmModal';
import { TariffTypeFormModal } from './TariffTypeFormModal';
import { usePermissions } from '@/hooks/usePermissions';
import type { TariffType } from '@/types/tariffs';

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

// ─── Column widths ────────────────────────────────────────────────────────────

const COL = {
  num:     'w-10 shrink-0',
  name:    'flex-1 min-w-0',
  days:    'w-36 shrink-0',
  guid:    'w-80 shrink-0',
  actions: 'w-12 shrink-0',
} as const;

const HEADERS: [string, string][] = [
  ['#',      COL.num],
  ['Nomi',   COL.name],
  ['Muddat', COL.days],
  ['GUID',   COL.guid],
  ['',       COL.actions],
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div className={`${COL.num}     h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.name}    h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.days}    h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.guid}    h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.actions} h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
        </div>
      ))}
    </>
  );
}

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({
  type, index, onDelete,
}: {
  type:     TariffType;
  index:    number;
  onDelete: (t: TariffType) => void;
}) {
  const { canDelete } = usePermissions();
  return (
    <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4 last:border-0">
      <span className={`${COL.num} text-sm font-semibold text-Color-Grey-Grey-500`}>{index}</span>

      <div className={`${COL.name} min-w-0`}>
        <span className="text-sm font-semibold text-Color-Grey-Grey-950">{type.name}</span>
      </div>

      <div className={COL.days}>
        {type.day_count > 0 ? (
          <span className="inline-flex items-center rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-medium text-Color-Grey-Grey-700">
            {type.day_count} kun
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-Color-Primary-Primary/10 px-2.5 py-0.5 text-xs font-semibold text-Color-Primary-Primary">
            Cheksiz
          </span>
        )}
      </div>

      <div className={COL.guid}>
        <span className="font-mono text-xs text-Color-Grey-Grey-500">{type.guid}</span>
      </div>

      <div className={COL.actions}>
        {canDelete('tariff_types') && (
          <button
            type="button"
            onClick={() => onDelete(type)}
            className="rounded-lg border border-transparent p-1.5 text-Color-Grey-Grey-600 transition-colors hover:border-red-300 hover:bg-Color-Danger-Danger-Soft hover:text-Color-Danger-Danger-Accent"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TariffTypesPage() {
  const { canWrite } = usePermissions();
  const [tick,        setTick]        = useState(0);
  const [createOpen,  setCreateOpen]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TariffType | null>(null);
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { toasts, push } = useToasts();

  const { types, loading } = useTariffTypes(tick);

  function handleCreateSuccess() {
    setTick((n) => n + 1);
    push("Yangi tarif turi muvaffaqiyatli qo'shildi!", true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteTariffType(deleteTarget.guid);
      setDeleteTarget(null);
      setTick((n) => n + 1);
      push("Tarif turi muvaffaqiyatli o'chirildi!", true);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "O'chirishda xatolik yuz berdi");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <ToastContainer toasts={toasts} />

      {createOpen && (
        <TariffTypeFormModal
          onClose={() => setCreateOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          userName={deleteTarget.name}
          isDeleting={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
        />
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-Color-Primary-Primary/10">
            <Layers className="h-5 w-5 text-Color-Primary-Primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">Tariflar turi</h1>
              {!loading && types.length > 0 && (
                <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                  {types.length}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Obuna rejalarining davomiyligi va turlari</p>
          </div>
        </div>

        {canWrite('tariff_types') && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-5 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Yangi tur
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        <div className="border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Tarif turlari ro'yxati</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-6 py-3">
              {HEADERS.map(([label, cls]) => (
                <div key={label} className={`${cls} text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>
                  {label}
                </div>
              ))}
            </div>

            {loading ? (
              <SkeletonRows />
            ) : types.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle className="h-10 w-10 text-Color-Grey-Grey-400" strokeWidth={1.5} />
                <p className="text-sm text-Color-Grey-Grey-500">Tarif turi topilmadi</p>
              </div>
            ) : (
              types.map((t, i) => (
                <DataRow
                  key={t.guid}
                  type={t}
                  index={i + 1}
                  onDelete={(type) => { setDeleteError(null); setDeleteTarget(type); }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
