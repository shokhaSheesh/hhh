import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, CreditCard, Check, X } from 'lucide-react';
import { useCards, deleteCard } from './hooks/useCards';
import { usePermissions } from '@/hooks/usePermissions';
import type { Card } from '@/types/cards';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

function fmtExpiry(raw: string) {
  if (raw.length === 4) return `${raw.slice(0, 2)}/${raw.slice(2)}`;
  return raw;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ─── Card type detection ──────────────────────────────────────────────────────
// Detect by number prefix; fall back to name string match.

function detectCardType(number: string, name: string): { label: string; cls: string } {
  const prefix = number.replace(/\s/g, '').slice(0, 4);
  const n      = name.toLowerCase();

  if (prefix.startsWith('9860') || n.includes('humo'))   return { label: 'Humo',   cls: 'bg-green-500/20  text-green-300  border-green-500/30'  };
  if (prefix.startsWith('5614') || n.includes('uzcard')) return { label: 'Uzcard', cls: 'bg-blue-500/20   text-blue-300   border-blue-500/30'   };
  if (prefix.startsWith('4'))                            return { label: 'Visa',   cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
  if (prefix.startsWith('5') || prefix.startsWith('2'))  return { label: 'MC',     cls: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
  return { label: name || 'Karta', cls: 'bg-gray-700/50 text-gray-300 border-gray-600/30' };
}

// ─── Verified badge ───────────────────────────────────────────────────────────

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
      Tasdiqlangan
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
      Kutilmoqda
    </span>
  );
}


// ─── Table row ────────────────────────────────────────────────────────────────

function CardRow({ card, onDelete }: { card: Card; onDelete: (card: Card) => void }) {
  const { canDelete }  = usePermissions();
  const cardType = detectCardType(card.number, card.name);
  const user     = card.users_id_data;

  return (
    <div className="flex min-w-max items-center gap-0 border-b border-dark-border/60 transition-colors hover:bg-white/[0.02]">
      {/* Foydalanuvchi */}
      <div className="w-64 shrink-0 py-3 pl-6 pr-4">
        {user ? (
          <div className="flex items-center gap-2.5">
            {user.photo ? (
              <img
                src={user.photo}
                alt={user.name}
                className="h-9 w-9 shrink-0 rounded-xl object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime/10 text-xs font-bold text-brand-lime"
              style={{ display: user.photo ? undefined : 'flex' }}
            >
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium capitalize text-white">
                {user.name.toLowerCase()}
              </p>
              <p className="font-mono text-xs text-gray-500">{user.phone}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-600">—</span>
        )}
      </div>

      {/* Karta nomi */}
      <div className="w-36 shrink-0 px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${cardType.cls}`}>
          <CreditCard className="h-3 w-3" />
          {cardType.label}
        </span>
      </div>

      {/* Karta raqami */}
      <div className="w-48 shrink-0 px-4 py-3">
        <span className="whitespace-nowrap font-mono text-sm text-white">{card.number}</span>
      </div>

      {/* Muddati */}
      <div className="w-24 shrink-0 px-4 py-3">
        <span className="font-mono text-sm text-gray-300">{fmtExpiry(card.expire_date)}</span>
      </div>

      {/* Qo'shilgan sana */}
      <div className="w-44 shrink-0 px-4 py-3">
        <span className="text-sm text-gray-400">{fmtDate(card.created_at)}</span>
      </div>

      {/* Holati */}
      <div className="w-36 shrink-0 px-4 py-3">
        <VerifiedBadge verified={card.verified} />
      </div>

      {/* Amallar */}
      <div className="w-20 shrink-0 px-4 py-3">
        {canDelete('cards') && (
          <button
            type="button"
            onClick={() => onDelete(card)}
            className="group/del rounded-xl border border-gray-700 bg-gray-800 p-1.5 transition-colors hover:border-red-500/50 hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover/del:text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 20;

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; ok: boolean; }
let _tid = 0;

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
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
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirm({ card, onConfirm, onCancel, deleting }: {
  card: Card; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-dark-border bg-dark-surface p-6 shadow-2xl">
        <p className="text-sm font-semibold text-white">Kartani o'chirishni tasdiqlang</p>
        <p className="mt-1 text-xs text-gray-400">
          <span className="font-mono text-gray-300">{card.number}</span> raqamli karta o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onCancel}
            className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5">
            Bekor qilish
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">
            {deleting ? "O'chirilmoqda…" : "O'chirish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CardsPage() {
  const [page,       setPage]       = useState(1);
  const [tick,       setTick]       = useState(0);
  const [toasts,     setToasts]     = useState<Toast[]>([]);
  const [confirmCard, setConfirmCard] = useState<Card | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  const { cards, total, loading, error } = useCards({ page, limit: LIMIT, tick });

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function pushToast(message: string, ok: boolean) {
    const id = ++_tid;
    setToasts((p) => [...p, { id, message, ok }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }

  function handleDelete(card: Card) {
    setConfirmCard(card);
  }

  async function confirmDelete() {
    if (!confirmCard) return;
    setDeleting(true);
    try {
      await deleteCard(confirmCard.guid);
      setConfirmCard(null);
      setTick((n) => n + 1);
      pushToast("Karta muvaffaqiyatli o'chirildi!", true);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "O'chirishda xatolik", false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} />
      {confirmCard && (
        <DeleteConfirm
          card={confirmCard}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmCard(null)}
          deleting={deleting}
        />
      )}
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Kartalar</h1>
          <p className="mt-0.5 text-sm text-gray-500">Foydalanuvchilar bank kartalari</p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-dark-border bg-dark-surface">
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Bank kartalar jadvali</h2>
        </div>

        {error && (
          <div className="px-6 py-4 text-sm text-red-400">{error}</div>
        )}

        <div className="overflow-x-auto">
          {/* Header row */}
          <div className="flex min-w-max items-center gap-0 border-b border-dark-border bg-gray-900/40">
            {[
              { label: 'Foydalanuvchi',   w: 'w-64', pl: true },
              { label: 'Karta nomi',      w: 'w-36'            },
              { label: 'Karta raqami',    w: 'w-48'            },
              { label: 'Muddati',         w: 'w-24'            },
              { label: "Qo'shilgan sana", w: 'w-44'            },
              { label: 'Holati',          w: 'w-36'            },
              { label: 'Amallar',         w: 'w-20'            },
            ].map(({ label, w, pl }) => (
              <div key={label} className={`${w} shrink-0 px-4 py-3 ${pl ? 'pl-6' : ''}`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="flex min-w-max items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-lime border-t-transparent" />
            </div>
          ) : cards.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-600">Kartalar topilmadi</div>
          ) : (
            cards.map((card) => (
              <CardRow key={card.guid} card={card} onDelete={handleDelete} />
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-dark-border px-6 py-4">
            <p className="text-xs text-gray-500">Jami {total} ta karta</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-border bg-dark-surface text-gray-400 transition-colors hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-400">{page} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-border bg-dark-surface text-gray-400 transition-colors hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
