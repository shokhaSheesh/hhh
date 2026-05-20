const SEVERITY_MAP = {
  critical: { label: 'Kritik ahvolda', cls: 'bg-red-500/15 text-red-400 border-red-500/25'     },
  warning:  { label: 'Ogohlantirish',  cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
} as const;

type Severity = keyof typeof SEVERITY_MAP;

interface Alert {
  id: string;
  station: string;
  issue: string;
  location: string;
  severity: Severity;
}

const ALERTS: Alert[] = [
  { id: '1', station: 'Stansiya YK00234', issue: "Aloqa yo'q",         location: 'Yunosobod tumani, Ahmad Donish', severity: 'critical' },
  { id: '2', station: 'Stansiya YK00234', issue: 'Harorat oshishi 60°', location: 'Yunosobod tumani, Ahmad Donish', severity: 'warning'  },
  { id: '3', station: 'Stansiya YK00234', issue: "Aloqa yo'q",         location: 'Yunosobod tumani, Ahmad Donish', severity: 'warning'  },
];

export default function ActiveAlerts() {
  return (
    <div className="flex flex-col rounded-2xl border border-dark-border bg-dark-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-base font-semibold text-white">
          Aktiv ogohlantirishlar
        </span>
        <button className="text-sm text-gray-500 transition-colors hover:text-white">
          Barchasini ko'rish
        </button>
      </div>

      {/* Rows */}
      <ul>
        {ALERTS.map((alert, i) => {
          const badge = SEVERITY_MAP[alert.severity];
          return (
            <li
              key={alert.id}
              className={[
                'flex items-start justify-between gap-3 px-5 py-3',
                i < ALERTS.length - 1 ? 'border-b border-dark-border' : '',
              ].join(' ')}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {alert.station} — {alert.issue}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {alert.location}
                </p>
              </div>

              <span
                className={[
                  'mt-0.5 shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  badge.cls,
                ].join(' ')}
              >
                {badge.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
