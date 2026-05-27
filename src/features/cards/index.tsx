import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, CreditCard, Check, X } from 'lucide-react';
import { useCards, deleteCard } from './hooks/useCards';
import { usePermissions } from '@/hooks/usePermissions';
import UserFilter, { type UserOption } from '@/components/UserFilter';
import type { Card } from '@/types/cards';

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

  if (prefix.startsWith('9860') || n.includes('humo'))   return { label: 'Humo',   cls: 'bg-purple-50 text-purple-700 border-purple-300'                                           };
  if (prefix.startsWith('5614') || n.includes('uzcard')) return { label: 'Uzcard', cls: 'bg-Color-Info-Info-Soft text-Color-Info-Info border-Color-Info-Info'                      };
  if (prefix.startsWith('4'))                            return { label: 'Visa',   cls: 'bg-Color-Warning-Warning-Soft text-Color-Warning-Warning border-Color-Warning-Warning'    };
  if (prefix.startsWith('5') || prefix.startsWith('2'))  return { label: 'MC',     cls: 'bg-Color-Danger-Danger-Soft text-Color-Danger-Danger-Accent border-Color-Danger-Danger-Accent' };
  return { label: name || 'Karta', cls: 'bg-Color-Grey-Grey-100 text-Color-Grey-Grey-700 border-Color-Grey-Grey-200' };
}

// ─── Verified badge ───────────────────────────────────────────────────────────

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center rounded-full border border-Color-Success-Success bg-Color-Success-Success-Soft px-2.5 py-0.5 text-xs font-medium text-Color-Success-Success">
      Tasdiqlangan
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-Color-Warning-Warning bg-Color-Warning-Warning-Soft px-2.5 py-0.5 text-xs font-medium text-Color-Warning-Warning">
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
    <div className="flex min-w-max items-center gap-0 border-b border-Color-Grey-Grey-200 transition-colors hover:bg-Color-Grey-Grey-50">
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
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-Color-Primary-Primary/10 text-xs font-bold text-Color-Primary-Primary"
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
          <span className="text-sm text-Color-Grey-Grey-500">—</span>
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
        <span className="whitespace-nowrap font-mono text-sm text-Color-Grey-Grey-950">{card.number}</span>
      </div>

      {/* Muddati */}
      <div className="w-24 shrink-0 px-4 py-3">
        <span className="font-mono text-sm text-Color-Grey-Grey-700">{fmtExpiry(card.expire_date)}</span>
      </div>

      {/* Qo'shilgan sana */}
      <div className="w-44 shrink-0 px-4 py-3">
        <span className="text-sm text-Color-Grey-Grey-600">{fmtDate(card.created_at)}</span>
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
            className="group/del rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 transition-colors hover:border-red-300 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5 text-Color-Grey-Grey-600 transition-colors group-hover/del:text-Color-Danger-Danger-Accent" />
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
          t.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
               : 'border-red-300 bg-red-50 text-red-600'
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
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-6 shadow-2xl">
        <p className="text-sm font-semibold text-Color-Grey-Grey-950">Kartani o'chirishni tasdiqlang</p>
        <p className="mt-1 text-xs text-Color-Grey-Grey-600">
          <span className="font-mono text-Color-Grey-Grey-700">{card.number}</span> raqamli karta o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onCancel}
            className="rounded-xl border border-Color-Grey-Grey-200 px-4 py-2 text-sm font-semibold text-Color-Grey-Grey-700 hover:bg-Color-Grey-Grey-50">
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

export default function CardsPage() {
  const [page,        setPage]        = useState(1);
  const [tick,        setTick]        = useState(0);
  const [userId,      setUserId]      = useState<string | undefined>(undefined);
  const [toasts,      setToasts]      = useState<Toast[]>([]);
  const [confirmCard, setConfirmCard] = useState<Card | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  const handleUserSelect = (u: UserOption | null) => { setUserId(u?.guid); setPage(1); };

  const { cards, total, loading, error } = useCards({ page, limit: LIMIT, userId, tick });

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
          <h1 className="text-2xl font-semibold text-Color-Grey-Grey-950">Kartalar</h1>
          <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Foydalanuvchilar bank kartalari</p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-Color-Grey-Grey-950">Bank kartalar jadvali</h2>
          <UserFilter onSelect={handleUserSelect} />
        </div>

        {error && (
          <div className="px-6 py-4 text-sm text-Color-Danger-Danger-Accent">{error}</div>
        )}

        <div className="overflow-x-auto">
          {/* Header row */}
          <div className="flex min-w-max items-center gap-0 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50">
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
                <span className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="flex min-w-max items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-Color-Info-Info-Accent border-t-transparent" />
            </div>
          ) : cards.length === 0 ? (
            <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">Kartalar topilmadi</div>
          ) : (
            cards.map((card) => (
              <CardRow key={card.guid} card={card} onDelete={handleDelete} />
            ))
          )}
        </div>

        {!loading && <Pagination page={page} total={total} limit={LIMIT} label="ta karta" onChange={setPage} />}
      </div>
    </div>
    </>
  );
}
