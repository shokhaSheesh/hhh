const STATUS_MAP = {
  success: { label: 'Muvaffaqiyatli', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  pending: { label: 'Jarayonda',      cls: 'bg-amber-500/15   text-amber-400   border-amber-500/25'   },
  error:   { label: 'Xatolik',        cls: 'bg-red-500/15     text-red-400     border-red-500/25'     },
} as const;

type SwapStatus = keyof typeof STATUS_MAP;

interface SwapRecord {
  id: string;
  type: string;
  user: string;
  location: string;
  given: string;
  returned: string;
  status: SwapStatus;
  time: string;
}

const SWAPS: SwapRecord[] = [
  { id: 'LOG-001', type: 'Almashtirish', user: 'Alisher Odilov',   location: 'Yunosobod tumani, Ahmad Donish', given: 'Stansiya YK00234', returned: 'Stansiya YK00234', status: 'success', time: '2025-11-10 14:22' },
  { id: 'LOG-001', type: 'Almashtirish', user: 'Sanjar Raxmonov',  location: 'Yunosobod tumani, Ahmad Donish', given: 'Stansiya YK00234', returned: 'Stansiya YK00234', status: 'pending', time: '2025-11-10 14:22' },
  { id: 'LOG-001', type: 'Almashtirish', user: 'Oybek Asqarov',    location: 'Yunosobod tumani, Ahmad Donish', given: 'Stansiya YK00234', returned: 'Stansiya YK00234', status: 'success', time: '2025-11-10 14:22' },
  { id: 'LOG-001', type: 'Almashtirish', user: 'Jamshid Jabborov', location: 'Yunosobod tumani, Ahmad Donish', given: 'Stansiya YK00234', returned: 'Stansiya YK00234', status: 'success', time: '2025-11-10 14:22' },
  { id: 'LOG-001', type: 'Almashtirish', user: 'Sherzod Ikromov',  location: 'Yunosobod tumani, Ahmad Donish', given: 'Stansiya YK00234', returned: 'Stansiya YK00234', status: 'success', time: '2025-11-10 14:22' },
  { id: 'LOG-001', type: 'Almashtirish', user: 'Rustam Umarov',    location: 'Yunosobod tumani, Ahmad Donish', given: 'Stansiya YK00234', returned: 'Stansiya YK00234', status: 'error',   time: '2025-11-10 14:22' },
  { id: 'LOG-001', type: 'Almashtirish', user: 'Sobir Xamidov',    location: 'Yunosobod tumani, Ahmad Donish', given: 'Stansiya YK00234', returned: 'Stansiya YK00234', status: 'success', time: '2025-11-10 14:22' },
];

export default function RecentSwapsTable() {
  return (
    <div className="flex flex-col rounded-2xl border border-dark-border bg-dark-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
        <span className="text-base font-semibold text-white">
          Oxirgi almashtirishlar
        </span>
        <button className="text-sm text-gray-500 transition-colors hover:text-white">
          Barchasini ko'rish
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border">
              {['ID', 'TURI', 'FOYDALANUVCHI', 'STANSIYA', 'BERILDI', 'QAYTARILDI', 'HOLATI', 'VAQTI'].map(
                (col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {SWAPS.map((row, i) => {
              const badge = STATUS_MAP[row.status];
              return (
                <tr
                  key={`${row.id}-${i}`}
                  className={[
                    'transition-colors hover:bg-white/[0.02]',
                    i < SWAPS.length - 1 ? 'border-b border-dark-border' : '',
                  ].join(' ')}
                >
                  <td className="px-6 py-3.5 font-mono text-xs font-semibold text-gray-300">
                    {row.id}
                  </td>
                  <td className="px-6 py-3.5 text-gray-300">{row.type}</td>
                  <td className="px-6 py-3.5 font-medium text-white">{row.user}</td>
                  <td className="px-6 py-3.5 text-gray-400">
                    <span className="block max-w-[160px] truncate">{row.location}</span>
                  </td>
                  <td className="px-6 py-3.5 text-gray-400">{row.given}</td>
                  <td className="px-6 py-3.5 text-gray-400">{row.returned}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={[
                        'rounded-full border px-2.5 py-1 text-xs font-medium',
                        badge.cls,
                      ].join(' ')}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 font-mono text-xs text-gray-500">
                    {row.time}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
