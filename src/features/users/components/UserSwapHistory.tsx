import { ChevronRight } from 'lucide-react';

// userId will be wired to real API later

interface SwapRow {
  id:      string;
  type:    'Olish' | 'Qaytarish';
  station: string;
  charger: string;
  time:    string;
  status:  'Muvaffaqiyatli' | 'Xato';
}

const MOCK: SwapRow[] = [
  { id: 'SW-001', type: 'Olish',     station: 'YK00234', charger: 'SN2002', time: '2025-11-10 14:22', status: 'Muvaffaqiyatli' },
  { id: 'SW-002', type: 'Qaytarish', station: 'YK00234', charger: 'SN2002', time: '2025-11-10 14:22', status: 'Muvaffaqiyatli' },
];

function TypeBadge({ type }: { type: SwapRow['type'] }) {
  return type === 'Olish' ? (
    <span className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-400">
      Olish
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-400">
      Qaytarish
    </span>
  );
}

function StatusBadge({ status }: { status: SwapRow['status'] }) {
  return status === 'Muvaffaqiyatli' ? (
    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
      Muvaffaqiyatli
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
      Xato
    </span>
  );
}

const TH = 'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500';
const TD = 'px-4 py-3 text-sm text-white';

export function UserSwapHistory({ userId: _userId }: { userId: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-dark-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark-border bg-gray-900/40 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Almashtirish tarixi</h3>
        <button className="inline-flex items-center gap-1 rounded-lg bg-[#D1F22D] px-3 py-1 text-xs font-semibold text-black transition-opacity hover:opacity-90">
          Batafsil <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead className="bg-gray-800/30">
          <tr>
            <th className={TH}>Almashtirish turi</th>
            <th className={TH}>Stansiya</th>
            <th className={TH}>Quvvatlagich</th>
            <th className={TH}>Vaqti</th>
            <th className={TH}>Holati</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {MOCK.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-white/[0.02]">
              <td className={TD}><TypeBadge type={row.type} /></td>
              <td className={`${TD} font-mono`}>{row.station}</td>
              <td className={`${TD} font-mono`}>{row.charger}</td>
              <td className={`${TD} font-mono text-gray-300`}>{row.time}</td>
              <td className={TD}><StatusBadge status={row.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
