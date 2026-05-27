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
  if (pct >= 70) return 'bg-Color-Success-Success-Soft text-Color-Success-Success border-Color-Success-Success';
  if (pct >= 30) return 'bg-Color-Warning-Warning-Soft text-Color-Warning-Warning border-Color-Warning-Warning';
  return                'bg-Color-Danger-Danger-Soft text-Color-Danger-Danger-Accent border-Color-Danger-Danger-Accent';
}

export default function ActiveStationsList() {
  return (
    <div className="flex flex-col rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-base font-semibold text-Color-Grey-Grey-950">
          Stansiyalar holati
        </span>
        <button className="text-sm text-Color-Grey-Grey-500 transition-colors hover:text-Color-Grey-Grey-950">
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
              i < STATIONS.length - 1 ? 'border-b border-Color-Grey-Grey-200' : '',
            ].join(' ')}
          >
            {/* Station info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-Color-Grey-Grey-950">{st.code}</p>
              <p className="truncate text-xs text-Color-Grey-Grey-600">{st.location}</p>
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
            <span className="w-20 shrink-0 text-right text-xs text-Color-Grey-Grey-600">
              {st.batteryCount}ta batareya
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
