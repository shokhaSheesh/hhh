import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, AlertCircle, Download, FileJson, X,
  ArrowRightLeft, CheckCircle2, XCircle,
} from 'lucide-react';
import { useTransactions } from './hooks/useTransactions';
import UserFilter, { type UserOption } from '@/components/UserFilter';
import { createApi, VIEW } from '@/api/client';
import type { Transaction, TransactionStatus, ExternalResponse, TransactionsListResponse } from '@/types/transactions';

// ─── Stat card ────────────────────────────────────────────────────────────────

const txApi = createApi(VIEW.transactions);

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

function useTxCounts() {
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [failedCount,    setFailedCount]    = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      txApi.post<TransactionsListResponse>('/transactions/items/list', { data: { offset: 0, limit: 1, status: ['completed'] } }),
      txApi.post<TransactionsListResponse>('/transactions/items/list', { data: { offset: 0, limit: 1, status: ['failed']    } }),
    ]).then(([a, b]) => {
      if (cancelled) return;
      setCompletedCount(a.data.data.count ?? 0);
      setFailedCount(b.data.data.count ?? 0);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return { completedCount, failedCount };
}

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

function fmtAmount(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + ' UZS';
}

function parseExternalResponse(raw: string | null): ExternalResponse | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as ExternalResponse; }
  catch { return null; }
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ─── Card chip ────────────────────────────────────────────────────────────────

const CARD_COLORS: Record<string, string> = {
  humo:   'bg-purple-50 text-purple-700 border-purple-300',
  uzcard: 'bg-Color-Info-Info-Soft text-Color-Info-Info border-Color-Info-Info',
  visa:   'bg-Color-Warning-Warning-Soft text-Color-Warning-Warning border-Color-Warning-Warning',
};

function CardChip({ name, number }: { name: string; number: string }) {
  const key    = name.toLowerCase();
  const cls    = CARD_COLORS[key] ?? 'bg-Color-Grey-Grey-100 text-Color-Grey-Grey-700 border-Color-Grey-Grey-200';
  const masked = number.replace(/(\d{4})\s*\d{4}\s*\d{4}\s*(\d{4})/, '$1 **** **** $2');
  return (
    <div className="space-y-0.5">
      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${cls}`}>
        {name}
      </span>
      <p className="font-mono text-xs text-Color-Grey-Grey-600">{masked || number}</p>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Muvaffaqiyatli', cls: 'border-Color-Success-Success bg-Color-Success-Success-Soft text-Color-Success-Success'               },
  failed:    { label: 'Bekor qilingan', cls: 'border-Color-Danger-Danger-Accent bg-Color-Danger-Danger-Soft text-Color-Danger-Danger-Accent'       },
};

function StatusBadge({ status }: { status: TransactionStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: 'border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 text-Color-Grey-Grey-600' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── JSON Details Modal ───────────────────────────────────────────────────────

function JsonModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const parsed = parseExternalResponse(tx.external_response);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-Color-Grey-Grey-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <FileJson className="h-4 w-4 text-Color-Grey-Grey-600" />
            <h2 className="text-sm font-semibold text-Color-Grey-Grey-950">Provider javobi</h2>
            {tx.transaction_id && (
              <span className="rounded-full border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-100 px-2 py-0.5 font-mono text-xs text-Color-Grey-Grey-600">
                {tx.transaction_id}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-Color-Grey-Grey-200 bg-Color-Light-Light p-1.5 text-Color-Grey-Grey-600 transition-colors hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {parsed === null ? (
            <p className="text-sm italic text-Color-Grey-Grey-500">Ma'lumot mavjud emas</p>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3">
                {([
                  { label: 'Payment ID',     value: parsed.payment_id            },
                  { label: 'Payment Status', value: String(parsed.payment_status) },
                  { label: 'Error Code',     value: String(parsed.error_code)     },
                  { label: 'Error Note',     value: parsed.error_note             },
                ] as { label: string; value: string }[]).map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 px-4 py-3">
                    <p className="mb-0.5 text-xs text-Color-Grey-Grey-600">{label}</p>
                    <p className="break-all text-sm font-medium text-Color-Grey-Grey-950">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Raw JSON</p>
              <pre className="overflow-x-auto rounded-xl bg-Color-Grey-Grey-100 p-4 font-mono text-xs leading-relaxed text-Color-Grey-Grey-950">
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function TxRow({
  tx,
  onShowJson,
}: {
  tx:         Transaction;
  onShowJson: (tx: Transaction) => void;
}) {
  const ext       = parseExternalResponse(tx.external_response);
  const errorNote = tx.status === 'failed' ? (ext?.error_note ?? null) : null;
  const amountCls = tx.status === 'completed' ? 'text-Color-Success-Success' : tx.status === 'failed' ? 'text-Color-Danger-Danger-Accent' : 'text-Color-Grey-Grey-950';

  return (
    <div className="flex min-w-max items-center gap-0 border-b border-Color-Grey-Grey-200 transition-colors hover:bg-Color-Grey-Grey-50">
      {/* Foydalanuvchi — sticky */}
      <div className="sticky left-0 z-10 w-56 shrink-0 border-r border-Color-Grey-Grey-200 bg-Color-Light-Light py-3 pl-6 pr-4">
        {tx.users_id_data ? (
          <div className="flex items-center gap-2.5">
            {tx.users_id_data.photo ? (
              <img
                src={tx.users_id_data.photo}
                alt={tx.users_id_data.name}
                className="h-8 w-8 shrink-0 rounded-xl object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-Color-Primary-Primary/10 text-xs font-bold text-Color-Primary-Primary"
              style={{ display: tx.users_id_data.photo ? undefined : 'flex' }}
            >
              {initials(tx.users_id_data.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium capitalize text-Color-Grey-Grey-950">
                {tx.users_id_data.name.toLowerCase()}
              </p>
              <p className="font-mono text-xs text-Color-Grey-Grey-600">{tx.users_id_data.phone}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-Color-Grey-Grey-500">—</span>
        )}
      </div>

      {/* Tranzaksiya ID */}
      <div className="w-36 shrink-0 px-4 py-3">
        <span className="font-mono text-xs text-Color-Grey-Grey-600">{tx.transaction_id || tx.guid.slice(0, 8)}</span>
      </div>

      {/* Summa */}
      <div className="w-36 shrink-0 px-4 py-3">
        <span className={`text-sm font-semibold ${amountCls}`}>{fmtAmount(tx.amount)}</span>
      </div>

      {/* To'lov usuli */}
      <div className="w-44 shrink-0 px-4 py-3">
        {tx.cards_id_data ? (
          <CardChip name={tx.cards_id_data.name} number={tx.cards_id_data.number} />
        ) : (
          <span className="text-sm text-Color-Grey-Grey-500">—</span>
        )}
      </div>

      {/* Holati */}
      <div className="w-40 shrink-0 px-4 py-3">
        <StatusBadge status={tx.status} />
      </div>

      {/* Sana */}
      <div className="w-40 shrink-0 px-4 py-3">
        <span className="text-sm text-Color-Grey-Grey-600">{fmtDate(tx.created_at)}</span>
      </div>

      {/* Provider javobi — error note + JSON button */}
      <div className="w-60 shrink-0 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {errorNote ? (
              <div className="flex items-start gap-1.5">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-Color-Danger-Danger-Accent" />
                <span className="text-xs leading-relaxed text-Color-Danger-Danger-Accent">{errorNote}</span>
              </div>
            ) : (
              <span className="text-xs text-Color-Grey-Grey-400">—</span>
            )}
          </div>
          {tx.external_response && (
            <button
              type="button"
              onClick={() => onShowJson(tx)}
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-Color-Grey-Grey-500 transition-colors hover:bg-Color-Grey-Grey-100 hover:text-Color-Grey-Grey-700"
              title="Provider javobini ko'rish"
            >
              <FileJson className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 20;

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

export default function TransactionsPage() {
  const [page,        setPage]        = useState(1);
  const [userId,      setUserId]      = useState<string | undefined>(undefined);
  const [jsonModalTx, setJsonModalTx] = useState<Transaction | null>(null);

  const handleUserSelect = (u: UserOption | null) => {
    setUserId(u?.guid);
    setPage(1);
  };

  const { transactions, total, loading, error } = useTransactions({ page, limit: LIMIT, userId });
  const { completedCount, failedCount } = useTxCounts();


  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-Color-Grey-Grey-950">Tranzaksiyalar</h1>
          <p className="mt-0.5 text-sm text-Color-Grey-Grey-600">Barcha moliyaviy operatsiyalar tarixi</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-Color-Info-Info-Accent px-5 py-2.5 text-sm font-semibold text-Color-Light-Constant-White transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Eksport
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Jami"        value={total}          icon={ArrowRightLeft} iconBg="bg-blue-600"    />
        <StatCard label="Yakunlangan" value={completedCount} icon={CheckCircle2}   iconBg="bg-emerald-600" />
        <StatCard label="Xatolik"     value={failedCount}    icon={XCircle}        iconBg="bg-red-500"     />
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
        <div className="flex items-center gap-4 border-b border-Color-Grey-Grey-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-Color-Grey-Grey-950">Tranzaksiyalar jadvali</h2>
          <UserFilter onSelect={handleUserSelect} />
        </div>

        {error && (
          <div className="px-6 py-4 text-sm text-Color-Danger-Danger-Accent">{error}</div>
        )}

        <div className="overflow-x-auto">
          {/* Header */}
          <div className="flex min-w-max items-center gap-0 border-b border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50">
            <div className="sticky left-0 z-20 w-56 shrink-0 border-r border-Color-Grey-Grey-200 bg-Color-Grey-Grey-50 py-3 pl-6 pr-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">Foydalanuvchi</span>
            </div>
            {[
              { label: 'Tranzaksiya ID',  w: 'w-36' },
              { label: 'Summa',           w: 'w-36' },
              { label: "To'lov usuli",    w: 'w-44' },
              { label: 'Holati',          w: 'w-40' },
              { label: 'Sana',            w: 'w-40' },
              { label: 'Provider javobi', w: 'w-60' },
            ].map(({ label, w }) => (
              <div key={label} className={`${w} shrink-0 px-4 py-3`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-Color-Grey-Grey-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="flex min-w-max items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-Color-Info-Info-Accent border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-sm text-Color-Grey-Grey-500">Tranzaksiyalar topilmadi</div>
          ) : (
            transactions.map((tx) => (
              <TxRow
                key={tx.guid}
                tx={tx}
                onShowJson={setJsonModalTx}
              />
            ))
          )}
        </div>

        {!loading && <Pagination page={page} total={total} limit={LIMIT} label="ta tranzaksiya" onChange={setPage} />}
      </div>

      {jsonModalTx && (
        <JsonModal tx={jsonModalTx} onClose={() => setJsonModalTx(null)} />
      )}
    </div>
  );
}
