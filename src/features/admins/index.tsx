import { useState, useRef } from 'react';
import { ShieldCheck, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdmins } from './hooks/useAdmins';
import { useDebounce } from '@/hooks/useDebounce';
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
  SUPER:  'border-brand-lime/30 bg-brand-lime/10 text-brand-lime',
  Super:  'border-brand-lime/30 bg-brand-lime/10 text-brand-lime',
  ADMIN:  'border-blue-500/30 bg-blue-500/10 text-blue-400',
  VIEWER: 'border-gray-600/30 bg-gray-700/30 text-gray-400',
};

function RoleBadge({ name }: { name: string | null }) {
  if (!name) return <span className="text-sm text-gray-600">—</span>;
  const cls = ROLE_COLORS[name] ?? 'border-gray-600/30 bg-gray-700/30 text-gray-500';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {name}
    </span>
  );
}

function PlatformBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-dark-border bg-gray-800/60 px-2 py-0.5 text-xs font-medium text-gray-400">
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
} as const;

const HEADERS: [string, string][] = [
  ['#',             COL.num],
  ['Login',         COL.login],
  ['Rol',           COL.role],
  ['Platforma',     COL.platform],
  ['Qo\'shilgan',   COL.date],
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-dark-border px-6 py-4">
          <div className={`${COL.num}      h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.login}    h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.role}     h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.platform} h-4 animate-pulse rounded bg-gray-800`} />
          <div className={`${COL.date}     h-4 animate-pulse rounded bg-gray-800`} />
        </div>
      ))}
    </>
  );
}

// ─── Data row ─────────────────────────────────────────────────────────────────

function DataRow({ admin, index }: { admin: Admin; index: number }) {
  const initials = admin.login.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-4 border-b border-dark-border px-6 py-4 last:border-0 transition-colors hover:bg-white/[0.02]">
      <span className={`${COL.num} text-sm font-semibold text-gray-500`}>{index}</span>

      <div className={`${COL.login} flex min-w-0 items-center gap-3`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime/10 text-xs font-bold text-brand-lime">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{admin.login}</p>
          <p className="font-mono text-xs text-gray-600">{admin.guid.slice(0, 8)}…</p>
        </div>
      </div>

      <div className={COL.role}>
        <RoleBadge name={admin.role_id_data?.name ?? null} />
      </div>

      <div className={COL.platform}>
        {admin.client_type_id_data?.name
          ? <PlatformBadge name={admin.client_type_id_data.name} />
          : <span className="text-sm text-gray-600">—</span>
        }
      </div>

      <div className={COL.date}>
        <span className="text-sm text-gray-400">{fmtDate(admin.created_at)}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminsPage() {
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { admins, total, loading, error } = useAdmins({
    page,
    limit: LIMIT,
    search: debouncedSearch,
  });

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime/10">
            <ShieldCheck className="h-5 w-5 text-brand-lime" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Administratorlar</h1>
              {total > 0 && (
                <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
                  {total}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-400">Tizim operatorlari va ularning rollari</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-surface">

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-dark-border px-6 py-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Login bo'yicha qidirish..."
              className="w-full rounded-xl border border-gray-700 bg-gray-900/60 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-gray-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header row */}
            <div className="flex items-center gap-4 border-b border-dark-border bg-gray-800/40 px-6 py-3">
              {HEADERS.map(([label, cls]) => (
                <div key={label} className={`${cls} text-xs font-semibold uppercase tracking-wider text-gray-400`}>
                  {label}
                </div>
              ))}
            </div>

            {/* Body */}
            {loading ? (
              <SkeletonRows />
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle className="h-10 w-10 text-red-500/60" strokeWidth={1.5} />
                <p className="text-sm font-medium text-red-400">{error}</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-600">
                {search ? 'Qidiruv natijasi topilmadi' : 'Administrator topilmadi'}
              </div>
            ) : (
              admins.map((a, i) => (
                <DataRow key={a.guid} admin={a} index={(page - 1) * LIMIT + i + 1} />
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-dark-border px-6 py-4">
            <p className="text-xs text-gray-500">Jami {total} ta administrator</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-border text-gray-400 transition-colors hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-400">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-border text-gray-400 transition-colors hover:bg-white/5 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
