import { useState, useRef } from 'react';
import { HelpCircle, AlertCircle, Plus, Check, X, Pencil, Trash2 } from 'lucide-react';
import { useFaq, deleteFaq } from './hooks/useFaq';
import FaqModal from './FaqModal';
import ConfirmModal from '@/components/ConfirmModal';
import type { Faq } from '@/types/faq';

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
        <div key={t.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
          t.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-red-300 bg-red-50 text-red-600'
        }`}>
          {t.ok ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(iso));
  } catch { return iso; }
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function FaqRow({ faq, index, onEdit, onDelete }: {
  faq:      Faq;
  index:    number;
  onEdit:   (faq: Faq) => void;
  onDelete: (faq: Faq) => void;
}) {
  const question = faq.question_uz || faq.question_ru || faq.question_en || '—';
  const answer   = faq.answer_uz   || faq.answer_ru   || faq.answer_en   || '—';

  return (
    <div className="flex items-start gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4 last:border-0 transition-colors hover:bg-Color-Grey-Grey-50">
      <span className="w-8 shrink-0 pt-0.5 text-sm font-semibold text-Color-Grey-Grey-600">{index}</span>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-Color-Grey-Grey-950 line-clamp-2">{question}</p>
        <p className="text-xs text-Color-Grey-Grey-600 line-clamp-2">{answer}</p>
      </div>
      <span className="w-24 shrink-0 pt-0.5 text-right text-xs text-Color-Grey-Grey-600">
        {fmtDate(faq.created_at)}
      </span>
      <div className="flex items-center justify-end gap-1 w-20 shrink-0">
        <button
          onClick={() => onEdit(faq)}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-500 transition-colors hover:bg-Color-Grey-Grey-50 hover:text-Color-Primary-Primary"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(faq)}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-500 transition-colors hover:bg-Color-Grey-Grey-50 hover:text-Color-Danger-Danger-Accent"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div className="w-8 h-4 mt-0.5 animate-pulse rounded bg-Color-Grey-Grey-200" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-Color-Grey-Grey-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-Color-Grey-Grey-200" />
          </div>
          <div className="w-24 h-4 mt-0.5 animate-pulse rounded bg-Color-Grey-Grey-200" />
          <div className="w-20 h-6 animate-pulse rounded bg-Color-Grey-Grey-200" />
        </div>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaqPage() {
  const [tick,        setTick]        = useState(0);
  const [editFaq,     setEditFaq]     = useState<Faq | null>(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const { toasts, push } = useToasts();

  const { faqs, total, loading, error } = useFaq(tick);

  const refetch = () => setTick((t) => t + 1);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFaq(deleteTarget.guid);
      setDeleteTarget(null);
      push("FAQ o'chirildi", true);
      refetch();
    } catch (e: unknown) {
      push(e instanceof Error ? e.message : "O'chirishda xatolik", false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ToastStack toasts={toasts} />

      {showCreate && (
        <FaqModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            push("FAQ muvaffaqiyatli qo'shildi", true);
            refetch();
          }}
        />
      )}

      {editFaq && (
        <FaqModal
          faq={editFaq}
          onClose={() => setEditFaq(null)}
          onSaved={() => {
            setEditFaq(null);
            push('FAQ muvaffaqiyatli yangilandi', true);
            refetch();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="FAQ o'chirilsinmi?"
          message={deleteTarget.question_uz || deleteTarget.question_ru || deleteTarget.question_en || undefined}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-Color-Primary-Primary/10">
              <HelpCircle className="h-5 w-5 text-Color-Primary-Primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">FAQ</h1>
                {total > 0 && (
                  <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                    {total}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Ko&apos;p so&apos;raladigan savollar</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-4 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Yangi FAQ
          </button>
        </div>

        {/* Table card */}
        <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
          {/* Table header */}
          <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-6 py-3">
            <div className="w-8 shrink-0 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">#</div>
            <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Savol / Javob</div>
            <div className="w-24 shrink-0 text-right text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Sana</div>
            <div className="w-20 shrink-0" />
          </div>

          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-Color-Danger-Danger-Accent" strokeWidth={1.5} />
              <p className="text-sm font-medium text-Color-Danger-Danger-Accent">{error}</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-Color-Grey-Grey-500">
              <HelpCircle className="h-8 w-8" />
              <p className="text-sm">FAQ topilmadi</p>
            </div>
          ) : (
            faqs.map((faq, i) => (
              <FaqRow
                key={faq.guid}
                faq={faq}
                index={i + 1}
                onEdit={setEditFaq}
                onDelete={setDeleteTarget}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
