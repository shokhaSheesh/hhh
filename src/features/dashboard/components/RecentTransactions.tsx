// Status badge variant config
const STATUS_MAP = {
  paid:      { label: "To'landi",       cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  cancelled: { label: 'Bekor qilingan', cls: 'bg-gray-700/60    text-gray-400    border-gray-600/30'    },
  pending:   { label: 'Jarayonda',      cls: 'bg-amber-500/15   text-amber-400   border-amber-500/25'   },
} as const;

type TxStatus = keyof typeof STATUS_MAP;

interface Transaction {
  id: string;
  name: string;
  type: string;
  method: string;
  time: string;
  status: TxStatus;
  amount: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: '1', name: 'Alisher Murodov',    type: 'Ijara',  method: 'Karta orqali',  time: '14:22', status: 'paid',      amount: "12 000 so'm" },
  { id: '2', name: 'Hoshim Qudratov',    type: 'Obuna',  method: 'Balans orqali', time: '14:22', status: 'cancelled', amount: "3 000 so'm"  },
  { id: '3', name: "Mirali Qo'shbekov",  type: 'Ijara',  method: 'Karta orqali',  time: '14:22', status: 'paid',      amount: "12 000 so'm" },
  { id: '4', name: 'Samandar Diyorov',   type: 'Obuna',  method: 'Balans orqali', time: '14:22', status: 'paid',      amount: "12 000 so'm" },
  { id: '5', name: 'Alisher Murodov',    type: 'Ijara',  method: 'Karta orqali',  time: '14:22', status: 'paid',      amount: "12 000 so'm" },
  { id: '6', name: 'Komil Ismoilov',     type: 'Obuna',  method: 'Balans orqali', time: '14:22', status: 'paid',      amount: "12 000 so'm" },
  { id: '7', name: 'Hoshim Qudratov',    type: 'Obuna',  method: 'Balans orqali', time: '14:22', status: 'pending',   amount: "12 000 so'm" },
  { id: '8', name: 'Alisher Murodov',    type: 'Ijara',  method: 'Karta orqali',  time: '14:22', status: 'paid',      amount: "12 000 so'm" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

// Consistent hue per name so initials don't change colour on every render
const AVATAR_COLORS = [
  'bg-blue-500/20 text-blue-400',
  'bg-violet-500/20 text-violet-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-amber-500/20 text-amber-400',
  'bg-rose-500/20 text-rose-400',
];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RecentTransactions() {
  return (
    <div className="flex flex-col rounded-2xl border border-dark-border bg-dark-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-base font-semibold text-white">
          Oxirgi tranzaksiyalar
        </span>
        <button className="text-sm text-gray-500 transition-colors hover:text-white">
          Barchasini ko'rish
        </button>
      </div>

      {/* Rows */}
      <ul>
        {TRANSACTIONS.map((tx, i) => {
          const badge = STATUS_MAP[tx.status];
          return (
            <li
              key={tx.id}
              className={[
                'flex items-center gap-3 px-5 py-3',
                i < TRANSACTIONS.length - 1 ? 'border-b border-dark-border' : '',
              ].join(' ')}
            >
              {/* Avatar */}
              <div
                className={[
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  avatarColor(tx.name),
                ].join(' ')}
              >
                {getInitials(tx.name)}
              </div>

              {/* Name + meta */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{tx.name}</p>
                <p className="text-xs text-gray-500">
                  {tx.type} • {tx.method} • {tx.time}
                </p>
              </div>

              {/* Status badge */}
              <span
                className={[
                  'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  badge.cls,
                ].join(' ')}
              >
                {badge.label}
              </span>

              {/* Amount */}
              <span className="shrink-0 text-sm font-semibold text-white">
                {tx.amount}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
