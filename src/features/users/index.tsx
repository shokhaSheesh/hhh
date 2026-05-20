import { useState, useRef } from 'react';
import {
  Search, Download, SlidersHorizontal,
  ChevronLeft, ChevronRight, AlertCircle,
  UserPlus, Pencil, Trash2, Check, X,
} from 'lucide-react';
import { useUsers } from './hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { UserModal }          from './components/UserModal';
import { UserFormModal }      from './components/UserFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { deleteUser } from './hooks/useUserMutations';
import { usePermissions } from '@/hooks/usePermissions';
import type { User } from '@/types/user';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; ok: boolean; }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
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

const PAGE_SIZE = 15;

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtBirthDate(val: string) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  } catch {
    return val;
  }
}

function fmtLanguage(langs: string[]) {
  if (!langs?.length) return '—';
  const map: Record<string, string> = { uz: "O'zbekcha", ru: 'Ruscha', en: 'Inglizcha' };
  return map[langs[0]] ?? langs[0];
}

// ─── Column widths (shared between header and rows) ───────────────────────────

const COL = {
  num:      'w-10 shrink-0',
  id:       'w-28 shrink-0',
  user:     'w-44 shrink-0',
  phone:    'w-36 shrink-0',
  passport: 'w-36 shrink-0',
  pinfl:    'w-44 shrink-0',
  dob:      'w-32 shrink-0',
  status:   'w-24 shrink-0',
  lang:     'w-28 shrink-0',
  action:   'w-32 shrink-0',
} as const;

const HEADERS: [string, string][] = [
  ['#',                  COL.num],
  ['Id',                 COL.id],
  ['Foydalanuvchi',      COL.user],
  ['Telefon',            COL.phone],
  ['Pasport seriyasi',   COL.passport],
  ['Jshshir',            COL.pinfl],
  ["Tug'ilgan sanasi",   COL.dob],
  ['Holati',             COL.status],
  ['Ilova tili',         COL.lang],
  ['',                   COL.action],
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean | null }) {
  if (active === true)
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
        Faol
      </span>
    );
  if (active === false)
    return (
      <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
        Nofaol
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-medium text-gray-500">
      —
    </span>
  );
}

function UserCell({ user }: { user: User }) {
  const initials = user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="relative h-6 w-6 shrink-0">
        <img
          src={user.photo}
          alt={user.name}
          className="h-6 w-6 rounded object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
            if (fb) fb.style.display = 'flex';
          }}
        />
        <div
          className="hidden h-6 w-6 items-center justify-center rounded bg-gray-700 text-[10px] font-semibold text-gray-300"
          aria-hidden
        >
          {initials}
        </div>
      </div>
      <span className="truncate text-sm font-semibold capitalize text-white">
        {user.name.toLowerCase()}
      </span>
    </div>
  );
}

function DataRow({ user, rowNum, onSelect, onEdit, onDelete }: {
  user: User; rowNum: number;
  onSelect: (u: User) => void;
  onEdit:   (u: User) => void;
  onDelete: (u: User) => void;
}) {
  const { canUpdate, canDelete } = usePermissions();
  return (
    <div
      className="group flex cursor-pointer items-center gap-6 border-b border-dark-border px-4 py-4 transition-colors hover:bg-white/[0.04]"
      onClick={() => onSelect(user)}
    >
      <span className={`${COL.num} text-sm font-semibold text-white`}>{rowNum}</span>
      <span className={`${COL.id} font-mono text-xs text-gray-400 truncate`}>{user.unique_id}</span>
      <div className={`${COL.user} sticky left-0 z-10 bg-dark-surface transition-colors group-hover:bg-[#1d1d25] shadow-[4px_0_8px_rgba(0,0,0,0.4)]`}>
        <UserCell user={user} />
      </div>
      <span className={`${COL.phone} font-mono text-sm font-semibold text-white`}>{user.phone || '—'}</span>
      <span className={`${COL.passport} text-sm font-semibold text-white`}>{user.passport_serial_number || '—'}</span>
      <span className={`${COL.pinfl} font-mono text-sm font-semibold text-white`}>{user.pinfl || '—'}</span>
      <span className={`${COL.dob} text-sm font-semibold text-white`}>{fmtBirthDate(user.birth_date)}</span>
      <div className={COL.status}><StatusBadge active={user.active} /></div>
      <span className={`${COL.lang} text-sm font-semibold text-white`}>{fmtLanguage(user.app_language)}</span>
      <div className={`${COL.action} flex items-center gap-1.5 justify-center`} onClick={(e) => e.stopPropagation()}>
        {canUpdate('users') && (
          <button
            title="Tahrirlash"
            className="group/edit rounded-xl border border-gray-700 bg-gray-800 p-1.5 transition-colors hover:border-brand-lime hover:bg-brand-lime"
            onClick={() => onEdit(user)}
          >
            <Pencil className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover/edit:text-black" />
          </button>
        )}
        {canDelete('users') && (
          <button
            title="O'chirish"
            className="group/del rounded-xl border border-gray-700 bg-gray-800 p-1.5 transition-colors hover:border-red-500 hover:bg-red-500"
            onClick={() => onDelete(user)}
          >
            <Trash2 className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover/del:text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-b border-dark-border px-4 py-4">
          <div className={`${COL.num} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.id} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.user} flex items-center gap-2`}>
            <div className="h-6 w-6 shrink-0 animate-pulse rounded bg-gray-800" />
            <div className="h-4 flex-1 animate-pulse rounded bg-gray-800" />
          </div>
          <div className={`${COL.phone} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.passport} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.pinfl} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.dob} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.status} h-6 animate-pulse rounded-full bg-gray-800`} />
          <div className={`${COL.lang} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.action} h-8 w-8 animate-pulse rounded-xl bg-gray-800`} />
        </div>
      ))}
    </>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-red-500/60" strokeWidth={1.5} />
      <p className="text-sm font-medium text-red-400">{message}</p>
      <p className="text-xs text-gray-600">.env faylida VITE_UCODE_TOKEN o'rnatilganligini tekshiring</p>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, total, pageSize, onChange }: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  const pages: (number | '...')[] = [];
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };
  add(1);
  if (page > 3) pages.push('...');
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) add(p);
  if (page < totalPages - 2) pages.push('...');
  if (totalPages > 1) add(totalPages);

  return (
    <div className="flex items-center justify-between border-t border-dark-border px-6 py-4">
      <span className="text-xs text-gray-500">
        {from}–{to} / {total.toLocaleString('ru-RU')} foydalanuvchi
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1 text-xs text-gray-600">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={[
                'h-7 min-w-[28px] rounded-lg px-2 text-xs font-medium transition-colors',
                p === page ? 'bg-[#D1F22D] text-black' : 'text-gray-400 hover:bg-white/5',
              ].join(' ')}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { canWrite } = usePermissions();
  const [page,         setPage]        = useState(1);
  const [rawSearch,    setRawSearch]   = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUser,     setEditUser]     = useState<User | null>(null);
  const [showCreate,   setShowCreate]   = useState(false);
  const [tick,         setTick]         = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting,   setIsDeleting]   = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);
  const { toasts, push } = useToasts();

  const search = useDebounce(rawSearch, 400);
  const handleSearch = (v: string) => { setRawSearch(v); setPage(1); };
  const refresh = () => setTick((t) => t + 1);

  const { users, total, loading, error } = useUsers({ page, limit: PAGE_SIZE, search, tick });

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteUser(deleteTarget.guid);
      setDeleteTarget(null);
      refresh();
      push("Foydalanuvchi muvaffaqiyatli o'chirildi!", true);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "O'chirishda xatolik");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
    {deleteTarget && (
      <DeleteConfirmModal
        userName={deleteTarget.name}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
      />
    )}
    {selectedUser && (
      <UserModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onDeleted={() => {
          setSelectedUser(null);
          refresh();
          push("Foydalanuvchi muvaffaqiyatli o'chirildi!", true);
        }}
      />
    )}
    {(showCreate || editUser) && (
      <UserFormModal
        user={editUser}
        onClose={() => { setShowCreate(false); setEditUser(null); }}
        onSuccess={() => {
          push(editUser ? "Foydalanuvchi ma'lumotlari muvaffaqiyatli yangilandi!" : "Mijoz muvaffaqiyatli qo'shildi!", true);
          refresh();
        }}
      />
    )}
    <ToastContainer toasts={toasts} />
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Foydalanuvchilar
            </h1>
            {total > 0 && (
              <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
                {total.toLocaleString('ru-RU')}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-400">Platforma foydalanuvchilari bazasi</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5">
            <Download className="h-4 w-4" />
            Eksport
          </button>
          {canWrite('users') && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-lime px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              <UserPlus className="h-4 w-4" />
              Yangi foydalanuvchi
            </button>
          )}
        </div>
      </div>

      {/* ── Table card ──────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">

        {/* Card heading */}
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-base font-semibold text-white">Foydalanuvchilar jadvali</h2>
        </div>

        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-border px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={rawSearch}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Ism, telefon yoki manzil..."
                className="w-72 rounded-xl border border-gray-700 bg-gray-900/60 py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-500"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-600">
              Holati
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-600">
              Ilova tili
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
            <SlidersHorizontal className="h-4 w-4" />
            Filtrlash
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="min-w-max px-6 py-4">
            {/* Header row */}
            <div className="flex items-center gap-6 rounded-xl bg-gray-800/40 px-4 py-3">
              {HEADERS.map(([label, cls]) => (
                <div
                  key={label}
                  className={`${cls} text-xs font-semibold uppercase tracking-wider text-gray-400 ${
                    label === 'Foydalanuvchi'
                      ? 'sticky left-0 z-10 bg-[#1a1c22] shadow-[4px_0_8px_rgba(0,0,0,0.4)]'
                      : ''
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Body rows */}
            <div className="mt-2 overflow-hidden rounded-xl bg-gray-900/20">
              {loading ? (
                <SkeletonRows />
              ) : error ? (
                <ErrorState message={error} />
              ) : users.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-600">
                  Foydalanuvchilar topilmadi
                </div>
              ) : (
                users.map((user, i) => (
                  <DataRow
                    key={user.guid}
                    user={user}
                    rowNum={(page - 1) * PAGE_SIZE + i + 1}
                    onSelect={setSelectedUser}
                    onEdit={setEditUser}
                    onDelete={(u) => { setDeleteError(null); setDeleteTarget(u); }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        {!loading && !error && (
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
      </div>
    </div>
    </>
  );
}
