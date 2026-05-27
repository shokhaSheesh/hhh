const SEVERITY_MAP = {
  critical: { label: 'Kritik ahvolda', cls: 'bg-Color-Danger-Danger-Soft text-Color-Danger-Danger-Accent border-Color-Danger-Danger-Accent'   },
  warning:  { label: 'Ogohlantirish',  cls: 'bg-Color-Warning-Warning-Soft text-Color-Warning-Warning border-Color-Warning-Warning' },
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
    <div className="flex flex-col rounded-2xl border border-Color-Grey-Grey-200 bg-Color-Light-Light">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-base font-semibold text-Color-Grey-Grey-950">
          Aktiv ogohlantirishlar
        </span>
        <button className="text-sm text-Color-Grey-Grey-500 transition-colors hover:text-Color-Grey-Grey-950">
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
                i < ALERTS.length - 1 ? 'border-b border-Color-Grey-Grey-200' : '',
              ].join(' ')}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-Color-Grey-Grey-950">
                  {alert.station} — {alert.issue}
                </p>
                <p className="mt-0.5 truncate text-xs text-Color-Grey-Grey-600">
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
