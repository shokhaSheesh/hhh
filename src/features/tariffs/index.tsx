import { useState, useRef } from 'react';
import { Tag, AlertCircle, Plus, Check, X, Pencil } from 'lucide-react';
import { useTariffs } from './hooks/useTariffs';
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
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(amount: number) {
  return amount.toLocaleString('ru-RU') + ' UZS';
}

// ─── Base tariff badge ────────────────────────────────────────────────────────

function BaseBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-brand-lime/30 bg-brand-lime/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-lime">
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
  actions: 'w-12 shrink-0',
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
        <div key={i} className="flex items-center gap-4 border-b border-dark-border px-4 py-5">
          <div className={`${COL.num}     h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.name}    h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.price}   h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.days}    h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.swaps}   h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.daily}   h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.limit}   h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.actions} h-4 animate-pulse rounded bg-gray-800`} />
        </div>
      ))}
    </>
  );
}

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({
  tariff, index, onEdit, onView,
}: {
  tariff:  Tariff;
  index:   number;
  onEdit:  (t: Tariff) => void;
  onView:  (t: Tariff) => void;
}) {
  const { canUpdate } = usePermissions();
  const dayCount = tariff.tariff_types_id_data?.day_count;

  return (
    <div
      onClick={() => onView(tariff)}
      className="relative flex cursor-pointer items-center gap-4 border-b border-dark-border py-5 pr-4 pl-4 transition-colors hover:bg-white/[0.02]"
      style={{ borderLeft: `3px solid ${tariff.color}` }}
    >
      <span className={`${COL.num} text-sm font-semibold text-gray-500`}>{index}</span>

      <div className={`${COL.name} flex min-w-0 flex-col gap-1`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-white">{tariff.name}</span>
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
        <span className="text-sm font-semibold text-white">{fmtPrice(tariff.amount)}</span>
      </div>

      <div className={COL.days}>
        {dayCount != null ? (
          <span className="text-sm text-gray-300">{dayCount} kun</span>
        ) : (
          <span className="text-sm text-gray-600">—</span>
        )}
      </div>

      <div className={COL.swaps}>
        <span className="text-sm text-gray-300">{tariff.swap_count}</span>
      </div>

      <div className={COL.daily}>
        <span className="text-sm text-gray-300">{tariff.daily_swap_limit} / kun</span>
      </div>

      <div className={COL.limit}>
        <span className="text-sm text-gray-400">{fmtPrice(tariff.over_limit_amount)}</span>
      </div>

      <div className={COL.actions}>
        {canUpdate('tariffs') && (
          <button
            type="button"
            title="Tahrirlash"
            onClick={(e) => { e.stopPropagation(); onEdit(tariff); }}
            className="group/edit rounded-xl border border-gray-700 bg-gray-800 p-1.5 transition-colors hover:border-brand-lime hover:bg-brand-lime"
          >
            <Pencil className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover/edit:text-black" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TariffsPage() {
  const { canWrite } = usePermissions();
  const [tick,       setTick]       = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tariff | null>(null);
  const [viewTarget, setViewTarget] = useState<Tariff | null>(null);
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

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime/10">
            <Tag className="h-5 w-5 text-brand-lime" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Tariflar</h1>
              {total > 0 && (
                <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
                  {total}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-400">Obuna rejalari va narxlar</p>
          </div>
        </div>

        {canWrite('tariffs') && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-lime px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Yangi tarif
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-base font-semibold text-white">Tariflar jadvali</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="flex items-center gap-4 border-b border-dark-border bg-gray-800/40 px-4 py-3">
              {HEADERS.map(([label, cls]) => (
                <div key={label} className={`${cls} text-xs font-semibold uppercase tracking-wider text-gray-400`}>
                  {label}
                </div>
              ))}
            </div>

            <div>
              {loading ? (
                <SkeletonRows />
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <AlertCircle className="h-10 w-10 text-red-500/60" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-red-400">{error}</p>
                </div>
              ) : tariffs.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-600">
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
