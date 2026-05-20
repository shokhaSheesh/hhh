import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const SEGMENTS = [
  { name: 'Stansiyada',  value:  49,  color: '#3B82F6' },
  { name: 'Ijarada',     value: 900,  color: '#F59E0B' },
  { name: "Signal yo'q", value:  51,  color: '#EF4444' },
];

const TOTAL = SEGMENTS.reduce((acc, s) => acc + s.value, 0);

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: entry } = payload[0];
  return (
    <div className="rounded-xl border border-gray-700 bg-[#13131E] px-3 py-2 shadow-2xl">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-xs text-gray-400">{name}</span>
      </div>
      <p className="mt-0.5 text-sm font-semibold text-white">{value} ta</p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BatteryStatusChart() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dark-border bg-dark-surface p-6">
      {/* Header */}
      <span className="text-base font-semibold text-white">
        Akkumulyator holati
      </span>

      {/* Donut with center label */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={SEGMENTS}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={96}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {SEGMENTS.map((seg) => (
                <Cell key={seg.name} fill={seg.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text — overlay within this relative container */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-gray-400">Jami akkumulyator</p>
            <p className="text-2xl font-bold text-white">{TOTAL.toLocaleString()} ta</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {SEGMENTS.map((seg) => (
          <li key={seg.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-xs text-gray-400">
              {seg.name}:{' '}
              <span className="font-semibold text-gray-200">{seg.value} ta</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
