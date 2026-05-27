import { useState, useRef } from 'react';
import { BookOpen, AlertCircle, ChevronLeft, ChevronRight, FileText, Plus, Check, X, Pencil, Eye, Trash2 } from 'lucide-react';
import { useDocuments, deleteDocument } from './hooks/useDocuments';
import ConfirmModal from '@/components/ConfirmModal';
import DocumentModal from './DocumentModal';
import DocumentViewerModal from './DocumentViewerModal';
import type { Document } from '@/types/documents';

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

const LIMIT = 20;

const DOC_TYPE_LABELS: Record<string, string> = {
  terms_of_use:   "Foydalanish shartlari",
  privacy_policy: "Maxfiylik siyosati",
};

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(iso));
  } catch { return iso; }
}

function fmtType(raw: string) {
  return DOC_TYPE_LABELS[raw] ?? raw.replace(/_/g, ' ');
}

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({ doc, index, onEdit, onView, onDelete }: {
  doc:      Document;
  index:    number;
  onEdit:   (doc: Document) => void;
  onView:   (doc: Document) => void;
  onDelete: (doc: Document) => void;
}) {
  const docType  = doc.document_type?.[0];
  const hasFiles = doc.files_uz?.[0] || doc.files_ru?.[0] || doc.files_en?.[0];

  return (
    <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4 last:border-0 transition-colors hover:bg-Color-Grey-Grey-50">
      <span className="w-10 shrink-0 text-sm font-semibold text-Color-Grey-Grey-600">{index}</span>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-Color-Primary-Primary/10">
        <FileText className="h-4 w-4 text-Color-Primary-Primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-Color-Grey-Grey-950">
          {doc.name_uz || doc.name_ru || doc.name_en || '—'}
        </p>
      </div>
      <div className="w-44 shrink-0">
        {docType ? (
          <span className="inline-flex items-center rounded-md border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-2 py-0.5 text-xs font-medium text-Color-Grey-Grey-600">
            {fmtType(docType)}
          </span>
        ) : (
          <span className="text-sm text-Color-Grey-Grey-500">—</span>
        )}
      </div>
      <div className="w-24 shrink-0">
        {hasFiles ? (
          <button
            onClick={() => onView(doc)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-2.5 py-1 text-xs font-medium text-Color-Grey-Grey-700 transition-colors hover:border-Color-Primary-Primary/40 hover:text-Color-Primary-Primary"
          >
            <Eye className="h-3 w-3" />
            Ko&apos;rish
          </button>
        ) : (
          <span className="text-xs text-Color-Grey-Grey-500">Fayl yo&apos;q</span>
        )}
      </div>
      <div className="w-28 shrink-0 text-right">
        <span className="text-sm text-Color-Grey-Grey-600">{fmtDate(doc.created_at)}</span>
      </div>
      <div className="flex items-center justify-end gap-1 w-20 shrink-0">
        <button
          onClick={() => onEdit(doc)}
          className="rounded-lg p-1.5 text-Color-Grey-Grey-500 transition-colors hover:bg-Color-Grey-Grey-50 hover:text-Color-Primary-Primary"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(doc)}
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
          <div className="w-10 h-4 mt-1 animate-pulse rounded bg-Color-Grey-Grey-200" />
          <div className="h-9 w-9 animate-pulse rounded-xl bg-Color-Grey-Grey-200 shrink-0" />
          <div className="flex-1 pt-1">
            <div className="h-4 w-48 animate-pulse rounded bg-Color-Grey-Grey-200" />
          </div>
          <div className="w-44 h-5 mt-1 animate-pulse rounded bg-Color-Grey-Grey-200" />
          <div className="w-36 space-y-1.5 pt-1">
            <div className="h-5 w-14 animate-pulse rounded bg-Color-Grey-Grey-200" />
            <div className="h-5 w-14 animate-pulse rounded bg-Color-Grey-Grey-200" />
            <div className="h-5 w-14 animate-pulse rounded bg-Color-Grey-Grey-200" />
          </div>
          <div className="w-28 h-4 mt-1 animate-pulse rounded bg-Color-Grey-Grey-200" />
        </div>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [page,          setPage]         = useState(1);
  const [editDoc,       setEditDoc]      = useState<Document | null>(null);
  const [viewDoc,       setViewDoc]      = useState<Document | null>(null);
  const [showCreate,    setShowCreate]   = useState(false);
  const [deleteTarget,  setDeleteTarget] = useState<Document | null>(null);
  const [deleting,      setDeleting]     = useState(false);
  const { toasts, push } = useToasts();

  const { documents, total, loading, error, refetch } = useDocuments({ page, limit: LIMIT });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(deleteTarget.guid);
      setDeleteTarget(null);
      push("Hujjat o'chirildi", true);
      refetch();
    } catch (e: unknown) {
      push(e instanceof Error ? e.message : "O'chirishda xatolik", false);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <ToastStack toasts={toasts} />

      {showCreate && (
        <DocumentModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            push("Hujjat muvaffaqiyatli qo'shildi", true);
            refetch();
          }}
        />
      )}

      {editDoc && (
        <DocumentModal
          doc={editDoc}
          onClose={() => setEditDoc(null)}
          onSaved={() => {
            setEditDoc(null);
            push("Hujjat muvaffaqiyatli yangilandi", true);
            refetch();
          }}
        />
      )}

      {viewDoc && (
        <DocumentViewerModal doc={viewDoc} onClose={() => setViewDoc(null)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Hujjat o'chirilsinmi?"
          message={deleteTarget.name_uz || deleteTarget.name_ru || deleteTarget.name_en || undefined}
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
            <BookOpen className="h-5 w-5 text-Color-Primary-Primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">Hujjatlar</h1>
              {total > 0 && (
                <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                  {total}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Tizim hujjatlari va materiallar</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-4 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Yangi hujjat
        </button>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-6 py-3">
          <div className="w-10 shrink-0 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">#</div>
          <div className="w-9 shrink-0" />
          <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Nomi</div>
          <div className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Turi</div>
          <div className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Fayl</div>
          <div className="w-28 shrink-0 text-right text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Sana</div>
          <div className="w-20 shrink-0" />
        </div>

        {/* Body */}
        {loading ? (
          <SkeletonRows />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-Color-Danger-Danger-Accent" strokeWidth={1.5} />
            <p className="text-sm font-medium text-Color-Danger-Danger-Accent">{error}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-Color-Grey-Grey-500">
            <BookOpen className="h-8 w-8" />
            <p className="text-sm">Hujjatlar topilmadi</p>
          </div>
        ) : (
          documents.map((doc, i) => (
            <DataRow
              key={doc.guid}
              doc={doc}
              index={(page - 1) * LIMIT + i + 1}
              onEdit={setEditDoc}
              onView={setViewDoc}
              onDelete={setDeleteTarget}
            />
          ))
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-Color-Grey-Grey-200 px-6 py-4">
            <p className="text-xs text-Color-Grey-Grey-600">Jami {total} ta hujjat</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-Color-Grey-Grey-200 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-50 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-Color-Grey-Grey-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-Color-Grey-Grey-200 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-50 disabled:opacity-30"
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
