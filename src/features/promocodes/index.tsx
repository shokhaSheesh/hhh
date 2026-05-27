import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Ticket, Plus, AlertCircle, Infinity, Pencil, Trash2, Check, X, ChevronDown, TicketCheck, TicketX } from 'lucide-react';
import { deletePromocode, updatePromocodeStatus } from './hooks/usePromocodes';
import { usePromocodes } from './hooks/usePromocodes';
import PromocodeModal from './PromocodeModal';
import { usePermissions } from '@/hooks/usePermissions';
import { createApi, VIEW } from '@/api/client';
import type { Promocode, PromocodesListResponse } from '@/types/promocodes';

// ─── Stat card ────────────────────────────────────────────────────────────────

const promoApi = createApi(VIEW.promocodes);

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

function usePromoCounts() {
  const [activeCount,   setActiveCount]   = useState<number | null>(null);
  const [inactiveCount, setInactiveCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      promoApi.post<PromocodesListResponse>('/promocodes/items/list', { data: { offset: 0, limit: 1, status: true  } }),
      promoApi.post<PromocodesListResponse>('/promocodes/items/list', { data: { offset: 0, limit: 1, status: false } }),
    ]).then(([a, b]) => {
      if (cancelled) return;
      setActiveCount(a.data.data.count ?? 0);
      setInactiveCount(b.data.data.count ?? 0);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return { activeCount, inactiveCount };
}

// ─── Discount cell ────────────────────────────────────────────────────────────

function DiscountCell({ amount, pct }: { amount: number | null; pct: number | null }) {
  if (pct != null && pct > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-sm font-semibold text-purple-700">
        {pct}%
      </span>
    );
  }
  if (amount != null) {
    return (
      <span className="text-sm font-semibold text-Color-Grey-Grey-950">
        {amount.toLocaleString('ru-RU')} UZS
      </span>
    );
  }
  return <span className="text-sm text-Color-Grey-Grey-500">—</span>;
}

// ─── Usage cell ───────────────────────────────────────────────────────────────

function UsageCell({ userCount, perUser }: { userCount: number | null; perUser: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-Color-Grey-Grey-950">
        {userCount == null ? (
          <span className="inline-flex items-center gap-1 text-Color-Primary-Primary">
            <Infinity className="h-4 w-4" /> Cheksiz
          </span>
        ) : (
          <>{userCount.toLocaleString('ru-RU')} ta</>
        )}
      </span>
      <span className="text-xs text-Color-Grey-Grey-600">{perUser} marta / foydalanuvchi</span>
    </div>
  );
}

// ─── Status dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({ promo, onToggled }: {
  promo:      import('@/types/promocodes').Promocode;
  onToggled:  () => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [pos,     setPos]     = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const openMenu = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 130) });
    setOpen(true);
  };

  const choose = async (status: boolean) => {
    if (status === promo.status) { setOpen(false); return; }
    setBusy(true);
    setOpen(false);
    try {
      await updatePromocodeStatus(promo, status);
      onToggled();
    } finally {
      setBusy(false);
    }
  };

  const badge = promo.status ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-Color-Success-Success bg-Color-Success-Success-Soft px-2.5 py-0.5 text-xs font-medium text-Color-Success-Success">
      <span className="h-1.5 w-1.5 rounded-full bg-Color-Success-Success" />Faol
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-medium text-Color-Grey-Grey-600">
      <span className="h-1.5 w-1.5 rounded-full bg-Color-Grey-Grey-400" />Nofaol
    </span>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={busy}
        onClick={() => open ? setOpen(false) : openMenu()}
        className="inline-flex items-center gap-1 disabled:opacity-50"
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      >
        {badge}
        <ChevronDown className="h-3 w-3 text-Color-Grey-Grey-500" />
      </button>

      {open && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="overflow-hidden rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-xl"
        >
          {[
            { value: true,  label: 'Faol',   dot: 'bg-Color-Success-Success', text: 'text-Color-Success-Success' },
            { value: false, label: 'Nofaol', dot: 'bg-Color-Grey-Grey-400',   text: 'text-Color-Grey-Grey-600'  },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onMouseDown={() => choose(opt.value)}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-Color-Grey-Grey-50 ${
                opt.value === promo.status ? opt.text + ' font-semibold' : 'text-Color-Grey-Grey-700'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${opt.dot}`} />
              {opt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
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
        <div key={i} className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-4 py-4">
          <div className={`${COL.num}     h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.key}     h-6 animate-pulse rounded-lg bg-Color-Grey-Grey-200`} />
          <div className={`${COL.disc}    h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.usage}   h-8 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.until}   h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.status}  h-6 w-20 animate-pulse rounded-full bg-Color-Grey-Grey-200`} />
          <div className={`${COL.actions} h-7 animate-pulse rounded-xl bg-Color-Grey-Grey-200`} />
        </div>
      ))}
    </>
  );
}

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({ promo, index, onEdit, onDelete, onToggled }: {
  promo: Promocode; index: number;
  onEdit:    (p: Promocode) => void;
  onDelete:  (p: Promocode) => void;
  onToggled: () => void;
}) {
  const { canUpdate, canDelete } = usePermissions();

  return (
    <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-4 py-4 transition-colors hover:bg-Color-Grey-Grey-50">
      <span className={`${COL.num} text-sm font-semibold text-Color-Grey-Grey-500`}>{index}</span>

      <div className={COL.key}>
        <span className="inline-flex items-center rounded-lg border border-Color-Primary-Primary/25 bg-Color-Primary-Primary/10 px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-Color-Primary-Primary">
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
          <span className="text-sm text-Color-Grey-Grey-700">{promo.valid_until}</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-Color-Grey-Grey-500">
            <Infinity className="h-3.5 w-3.5" /> Muddatsiz
          </span>
        )}
      </div>

      <div className={COL.status}>
        <StatusDropdown promo={promo} onToggled={onToggled} />
      </div>

      <div className={`${COL.actions} flex items-center gap-1.5`}>
        {canUpdate('promocodes') && (
          <button type="button" title="Tahrirlash" onClick={() => onEdit(promo)}
            className="group/e rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 transition-colors hover:border-Color-Primary-Primary hover:bg-Color-Primary-Primary">
            <Pencil className="h-3.5 w-3.5 text-Color-Grey-Grey-600 transition-colors group-hover/e:text-Color-Dark-Constant-Dark" />
          </button>
        )}
        {canDelete('promocodes') && (
          <button type="button" title="O'chirish" onClick={() => onDelete(promo)}
            className="group/d rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 transition-colors hover:border-Color-Danger-Danger-Accent hover:bg-Color-Danger-Danger-Soft">
            <Trash2 className="h-3.5 w-3.5 text-Color-Grey-Grey-600 transition-colors group-hover/d:text-Color-Danger-Danger-Accent" />
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
  const { activeCount, inactiveCount } = usePromoCounts();

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
              t.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                   : 'border-red-300 bg-red-50 text-red-600'
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
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-6 shadow-2xl">
            <p className="text-sm font-semibold text-Color-Grey-Grey-950">Promokodni o'chirishni tasdiqlang</p>
            <p className="mt-1 text-xs text-Color-Grey-Grey-600">
              <span className="font-mono text-Color-Grey-Grey-700">{confirmDel.key}</span> promokodi o'chiriladi.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setConfirmDel(null)}
                className="rounded-xl border border-Color-Grey-Grey-200 px-4 py-2 text-sm font-semibold text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-50">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-Color-Primary-Primary/10">
            <Ticket className="h-5 w-5 text-Color-Primary-Primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">Promokodlar</h1>
              {total > 0 && (
                <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                  {total}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Chegirma kodlari va aksiyalar</p>
          </div>
        </div>

        {canWrite('promocodes') && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-5 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Promokod qo'shish
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Jami"   value={total}         icon={Ticket}     iconBg="bg-blue-600"    />
        <StatCard label="Faol"   value={activeCount}   icon={TicketCheck} iconBg="bg-emerald-600" />
        <StatCard label="Nofaol" value={inactiveCount} icon={TicketX}    iconBg="bg-red-500"     />
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        <div className="border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-base font-semibold text-Color-Grey-Grey-950">Promokodlar jadvali</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-3">
              {HEADERS.map(([label, cls]) => (
                <div key={label} className={`${cls} text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>
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
                  <AlertCircle className="h-10 w-10 text-Color-Danger-Danger-Accent" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-Color-Danger-Danger-Accent">{error}</p>
                </div>
              ) : promocodes.length === 0 ? (
                <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">
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
                    onToggled={() => setTick((t) => t + 1)}
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
