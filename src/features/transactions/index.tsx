import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, AlertCircle, Download, FileJson, X,
} from 'lucide-react';
import { useTransactions } from './hooks/useTransactions';
import type { Transaction, TransactionStatus, ExternalResponse } from '@/types/transactions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
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
  humo:   'bg-purple-500/20 text-purple-300 border-purple-500/30',
  uzcard: 'bg-blue-500/20   text-blue-300   border-blue-500/30',
  visa:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

function CardChip({ name, number }: { name: string; number: string }) {
  const key    = name.toLowerCase();
  const cls    = CARD_COLORS[key] ?? 'bg-gray-700/50 text-gray-300 border-gray-600/30';
  const masked = number.replace(/(\d{4})\s*\d{4}\s*\d{4}\s*(\d{4})/, '$1 **** **** $2');
  return (
    <div className="space-y-0.5">
      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${cls}`}>
        {name}
      </span>
      <p className="font-mono text-xs text-gray-500">{masked || number}</p>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Muvaffaqiyatli', cls: 'border-green-500/30 bg-green-500/10 text-green-400' },
  failed:    { label: 'Bekor qilingan', cls: 'border-red-500/30   bg-red-500/10   text-red-400'   },
};

function StatusBadge({ status }: { status: TransactionStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: 'border-gray-700 bg-gray-800 text-gray-400' };
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
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-dark-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <FileJson className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-white">Provider javobi</h2>
            {tx.transaction_id && (
              <span className="rounded-full border border-dark-border bg-gray-800 px-2 py-0.5 font-mono text-xs text-gray-400">
                {tx.transaction_id}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-700 bg-gray-800 p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {parsed === null ? (
            <p className="text-sm italic text-gray-600">Ma'lumot mavjud emas</p>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3">
                {([
                  { label: 'Payment ID',     value: parsed.payment_id            },
                  { label: 'Payment Status', value: String(parsed.payment_status) },
                  { label: 'Error Code',     value: String(parsed.error_code)     },
                  { label: 'Error Note',     value: parsed.error_note             },
                ] as { label: string; value: string }[]).map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-dark-border bg-[#0D0D12] px-4 py-3">
                    <p className="mb-0.5 text-xs text-gray-600">{label}</p>
                    <p className="break-all text-sm font-medium text-white">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Raw JSON</p>
              <pre className="overflow-x-auto rounded-xl bg-[#0D0D12] p-4 font-mono text-xs leading-relaxed text-green-300">
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
  onDownloadReceipt,
}: {
  tx:                Transaction;
  onShowJson:        (tx: Transaction) => void;
  onDownloadReceipt: (tx: Transaction) => void;
}) {
  const ext       = parseExternalResponse(tx.external_response);
  const errorNote = tx.status === 'failed' ? (ext?.error_note ?? null) : null;
  const amountCls = tx.status === 'completed' ? 'text-green-400' : tx.status === 'failed' ? 'text-red-400' : 'text-white';

  return (
    <div className="flex min-w-max items-center gap-0 border-b border-dark-border/60 transition-colors hover:bg-white/[0.02]">
      {/* Foydalanuvchi — sticky */}
      <div className="sticky left-0 z-10 w-56 shrink-0 border-r border-gray-800/60 bg-[#16161D] py-3 pl-6 pr-4">
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
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-lime/10 text-xs font-bold text-brand-lime"
              style={{ display: tx.users_id_data.photo ? undefined : 'flex' }}
            >
              {initials(tx.users_id_data.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium capitalize text-white">
                {tx.users_id_data.name.toLowerCase()}
              </p>
              <p className="font-mono text-xs text-gray-500">{tx.users_id_data.phone}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-600">—</span>
        )}
      </div>

      {/* Tranzaksiya ID */}
      <div className="w-36 shrink-0 px-4 py-3">
        <span className="font-mono text-xs text-gray-400">{tx.transaction_id || tx.guid.slice(0, 8)}</span>
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
          <span className="text-sm text-gray-600">—</span>
        )}
      </div>

      {/* Holati */}
      <div className="w-40 shrink-0 px-4 py-3">
        <StatusBadge status={tx.status} />
      </div>

      {/* Sana */}
      <div className="w-40 shrink-0 px-4 py-3">
        <span className="text-sm text-gray-400">{fmtDate(tx.created_at)}</span>
      </div>

      {/* Provider javobi — error note + JSON button */}
      <div className="w-60 shrink-0 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {errorNote ? (
              <div className="flex items-start gap-1.5">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                <span className="text-xs leading-relaxed text-red-300">{errorNote}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-700">—</span>
            )}
          </div>
          {tx.external_response && (
            <button
              type="button"
              onClick={() => onShowJson(tx)}
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-white/5 hover:text-gray-300"
              title="Provider javobini ko'rish"
            >
              <FileJson className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Fiskal chek */}
      <div className="w-28 shrink-0 px-4 py-3">
        <button
          type="button"
          onClick={() => onDownloadReceipt(tx)}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-dark-border bg-dark-surface text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
          title="Fiskal chek yuklab olish"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 20;

export default function TransactionsPage() {
  const [page,        setPage]        = useState(1);
  const [jsonModalTx, setJsonModalTx] = useState<Transaction | null>(null);

  const { transactions, total, loading, error } = useTransactions({ page, limit: LIMIT });

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function handleDownloadReceipt(tx: Transaction) {
    console.log('Downloading receipt for:', tx.transaction_id || tx.guid);
    alert(`Fiskal chek yuklab olinmoqda: ${tx.transaction_id || tx.guid}`);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tranzaksiyalar</h1>
          <p className="mt-0.5 text-sm text-gray-500">Barcha moliyaviy operatsiyalar tarixi</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Eksport
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-dark-border bg-dark-surface">
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Tranzaksiyalar jadvali</h2>
        </div>

        {error && (
          <div className="px-6 py-4 text-sm text-red-400">{error}</div>
        )}

        <div className="overflow-x-auto">
          {/* Header */}
          <div className="flex min-w-max items-center gap-0 border-b border-dark-border bg-gray-900/40">
            <div className="sticky left-0 z-20 w-56 shrink-0 border-r border-gray-800/60 bg-[#1c1f29] py-3 pl-6 pr-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Foydalanuvchi</span>
            </div>
            {[
              { label: 'Tranzaksiya ID',  w: 'w-36' },
              { label: 'Summa',           w: 'w-36' },
              { label: "To'lov usuli",    w: 'w-44' },
              { label: 'Holati',          w: 'w-40' },
              { label: 'Sana',            w: 'w-40' },
              { label: 'Provider javobi', w: 'w-60' },
              { label: 'Fiskal chek',     w: 'w-28' },
            ].map(({ label, w }) => (
              <div key={label} className={`${w} shrink-0 px-4 py-3`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div className="flex min-w-max items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-lime border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-600">Tranzaksiyalar topilmadi</div>
          ) : (
            transactions.map((tx) => (
              <TxRow
                key={tx.guid}
                tx={tx}
                onShowJson={setJsonModalTx}
                onDownloadReceipt={handleDownloadReceipt}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-dark-border px-6 py-4">
            <p className="text-xs text-gray-500">Jami {total} ta tranzaksiya</p>
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

      {jsonModalTx && (
        <JsonModal tx={jsonModalTx} onClose={() => setJsonModalTx(null)} />
      )}
    </div>
  );
}
