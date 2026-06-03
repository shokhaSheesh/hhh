import { useState, useRef } from 'react';
import {
  ShieldCheck, AlertCircle, Search, ChevronLeft, ChevronRight,
  Plus, Pencil, Trash2, Check, X,
} from 'lucide-react';
import { useAdmins, deleteAdmin } from './hooks/useAdmins';
import { usePermissions } from '@/hooks/usePermissions';
import AdminModal from './AdminModal';
import type { Admin } from '@/types/admins';

const LIMIT = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(iso));
  } catch { return iso; }
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  SUPER:  'border-Color-Primary-Primary bg-Color-Primary-Primary/10 text-Color-Primary-Primary',
  Super:  'border-Color-Primary-Primary bg-Color-Primary-Primary/10 text-Color-Primary-Primary',
  ADMIN:  'border-Color-Info-Info bg-Color-Info-Info-Soft text-Color-Info-Info',
  VIEWER: 'border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 text-Color-Grey-Grey-600',
};

function RoleBadge({ name }: { name: string | null }) {
  if (!name) return <span className="text-sm text-Color-Grey-Grey-500">—</span>;
  const cls = ROLE_COLORS[name] ?? 'border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 text-Color-Grey-Grey-600';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {name}
    </span>
  );
}

function PlatformBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-2 py-0.5 text-xs font-medium text-Color-Grey-Grey-600">
      {name}
    </span>
  );
}

// ─── Column widths ────────────────────────────────────────────────────────────

const COL = {
  num:      'w-10 shrink-0',
  login:    'flex-1 min-w-0',
  role:     'w-36 shrink-0',
  platform: 'w-40 shrink-0',
  date:     'w-36 shrink-0',
  actions:  'w-20 shrink-0',
} as const;

const HEADERS: [string, string][] = [
  ['#',           COL.num],
  ['Login',       COL.login],
  ['Rol',         COL.role],
  ['Platforma',   COL.platform],
  ["Qo'shilgan", COL.date],
  ['',            COL.actions],
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div className={`${COL.num}      h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.login}    h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.role}     h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.platform} h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.date}     h-4 animate-pulse rounded bg-Color-Grey-Grey-200`} />
          <div className={`${COL.actions}  h-7 animate-pulse rounded-xl bg-Color-Grey-Grey-200`} />
        </div>
      ))}
    </>
  );
}

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({ admin, index, onEdit, onDelete }: {
  admin: Admin; index: number;
  onEdit:   (a: Admin) => void;
  onDelete: (a: Admin) => void;
}) {
  const { canUpdate, canDelete } = usePermissions();
  const initials = admin.login.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4 last:border-0 transition-colors hover:bg-Color-Grey-Grey-50">
      <span className={`${COL.num} text-sm font-semibold text-Color-Grey-Grey-500`}>{index}</span>

      <div className={`${COL.login} flex min-w-0 items-center gap-3`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-Color-Primary-Primary/10 text-xs font-bold text-Color-Primary-Primary">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-Color-Grey-Grey-950">{admin.login}</p>
          <p className="font-mono text-xs text-Color-Grey-Grey-500">{admin.guid.slice(0, 8)}…</p>
        </div>
      </div>

      <div className={COL.role}>
        <RoleBadge name={admin.role_id_data?.name ?? null} />
      </div>

      <div className={COL.platform}>
        {admin.client_type_id_data?.name
          ? <PlatformBadge name={admin.client_type_id_data.name} />
          : <span className="text-sm text-Color-Grey-Grey-500">—</span>
        }
      </div>

      <div className={COL.date}>
        <span className="text-sm text-Color-Grey-Grey-600">{fmtDate(admin.created_at)}</span>
      </div>

      <div className={`${COL.actions} flex items-center gap-1.5`}>
        {canUpdate('admins') && (
          <button type="button" title="Tahrirlash" onClick={() => onEdit(admin)}
            className="group/e rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 transition-colors hover:border-Color-Primary-Primary hover:bg-Color-Primary-Primary">
            <Pencil className="h-3.5 w-3.5 text-Color-Grey-Grey-600 transition-colors group-hover/e:text-Color-Dark-Constant-Dark" />
          </button>
        )}
        {canDelete('admins') && (
          <button type="button" title="O'chirish" onClick={() => onDelete(admin)}
            className="group/d rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 transition-colors hover:border-red-300 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5 text-Color-Grey-Grey-600 transition-colors group-hover/d:text-Color-Danger-Danger-Accent" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminsPage() {
  const { canWrite } = usePermissions();
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<Admin | null>(null);
  const [confirmDel,  setConfirmDel]  = useState<Admin | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const [toasts,      setToasts]      = useState<{ id: number; message: string; ok: boolean }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { admins: allAdmins, loading, error, refetch } = useAdmins();

  const filtered = search.trim()
    ? allAdmins.filter((a) => a.login?.toLowerCase().includes(search.trim().toLowerCase()))
    : allAdmins;

  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const admins     = filtered.slice((page - 1) * LIMIT, page * LIMIT);

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
      await deleteAdmin(confirmDel.guid);
      setConfirmDel(null);
      refetch();
      pushToast("Administrator muvaffaqiyatli o'chirildi!", true);
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
            <p className="text-sm font-semibold text-Color-Grey-Grey-950">Administratorni o'chirishni tasdiqlang</p>
            <p className="mt-1 text-xs text-Color-Grey-Grey-600">
              <span className="font-medium text-Color-Grey-Grey-700">{confirmDel.login}</span> o'chiriladi.
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
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-Color-Primary-Primary/10">
              <ShieldCheck className="h-5 w-5 text-Color-Primary-Primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-Color-Grey-Grey-950">Administratorlar</h1>
                {total > 0 && (
                  <span className="rounded-full bg-Color-Grey-Grey-100 px-2.5 py-0.5 text-xs font-semibold text-Color-Grey-Grey-600">
                    {total}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Tizim operatorlari va ularning rollari</p>
            </div>
          </div>

          {canWrite('admins') && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-5 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Administrator qo'shish
            </button>
          )}
        </div>

        {/* Table card */}
        <div className="overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
          {/* Toolbar */}
          <div className="flex items-center gap-3 border-b border-Color-Grey-Grey-200 px-6 py-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-Color-Grey-Grey-500" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Login bo'yicha qidirish..."
                className="w-full rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 py-2 pl-9 pr-4 text-sm text-Color-Grey-Grey-950 placeholder-Color-Grey-Grey-500 outline-none transition-colors focus:border-Color-Grey-Grey-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Header row */}
              <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-6 py-3">
                {HEADERS.map(([label, cls]) => (
                  <div key={label} className={`${cls} text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600`}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Body */}
              {loading ? (
                <SkeletonRows />
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <AlertCircle className="h-10 w-10 text-red-400" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-Color-Danger-Danger-Accent">{error}</p>
                </div>
              ) : admins.length === 0 ? (
                <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">
                  {search ? 'Qidiruv natijasi topilmadi' : 'Administrator topilmadi'}
                </div>
              ) : (
                admins.map((a, i) => (
                  <DataRow
                    key={a.guid}
                    admin={a}
                    index={(page - 1) * LIMIT + i + 1}
                    onEdit={(a) => setEditTarget(a)}
                    onDelete={(a) => setConfirmDel(a)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-Color-Grey-Grey-200 px-6 py-4">
              <p className="text-xs text-Color-Grey-Grey-600">Jami {total} ta administrator</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-Color-Grey-Grey-200 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-Color-Grey-Grey-600">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-Color-Grey-Grey-200 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <AdminModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => { refetch(); pushToast("Administrator muvaffaqiyatli qo'shildi!", true); }}
        />
      )}
      {editTarget && (
        <AdminModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { refetch(); pushToast('Administrator muvaffaqiyatli yangilandi!', true); }}
        />
      )}
    </>
  );
}
