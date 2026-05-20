interface Station {
  id: string;
  code: string;
  location: string;
  batteryPct: number;
  batteryCount: number;
}

const STATIONS: Station[] = [
  { id: '1', code: 'O40001', location: 'Yunosobod tumani, Ahmad Donish', batteryPct: 85,  batteryCount: 4 },
  { id: '2', code: 'O40002', location: 'Yunosobod tumani, Ahmad Donish', batteryPct: 12,  batteryCount: 6 },
  { id: '3', code: 'YK2002', location: 'Yunosobod tumani, Ahmad Donish', batteryPct: 0,   batteryCount: 0 },
  { id: '4', code: 'ZC0002', location: 'Yunosobod tumani, Ahmad Donish', batteryPct: 90,  batteryCount: 8 },
  { id: '5', code: 'T50001', location: 'Yunosobod tumani, Ahmad Donish', batteryPct: 41,  batteryCount: 3 },
];

function pctBadgeClass(pct: number) {
  if (pct >= 70) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (pct >= 30) return 'bg-amber-500/20  text-amber-400  border-amber-500/30';
  return                'bg-red-500/20    text-red-400    border-red-500/30';
}

export default function ActiveStationsList() {
  return (
    <div className="flex flex-col rounded-2xl border border-dark-border bg-dark-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-base font-semibold text-white">
          Stansiyalar holati
        </span>
        <button className="text-sm text-gray-500 transition-colors hover:text-white">
          Barchasini ko'rish
        </button>
      </div>

      {/* Rows */}
      <ul>
        {STATIONS.map((st, i) => (
          <li
            key={st.id}
            className={[
              'flex items-center gap-3 px-5 py-3',
              i < STATIONS.length - 1 ? 'border-b border-dark-border' : '',
            ].join(' ')}
          >
            {/* Station info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{st.code}</p>
              <p className="truncate text-xs text-gray-500">{st.location}</p>
            </div>

            {/* Percentage badge */}
            <span
              className={[
                'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums',
                pctBadgeClass(st.batteryPct),
              ].join(' ')}
            >
              {st.batteryPct}%
            </span>

            {/* Battery count */}
            <span className="w-20 shrink-0 text-right text-xs text-gray-400">
              {st.batteryCount}ta batareya
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
