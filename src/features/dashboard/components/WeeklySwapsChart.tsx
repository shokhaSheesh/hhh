import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DATA = [
  { date: '01.02.2026', swaps: 12 },
  { date: '02.02.2026', swaps: 22 },
  { date: '03.02.2026', swaps: 17 },
  { date: '04.02.2026', swaps: 30 },
  { date: '05.02.2026', swaps: 28 },
  { date: '06.02.2026', swaps: 21 },
  { date: '07.02.2026', swaps: 16 },
];

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-700 bg-[#13131E] px-3 py-2 shadow-2xl">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">
        {payload[0].value} ta
      </p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WeeklySwapsChart() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dark-border bg-dark-surface p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-white">
          Akkumulyator almashtirish — haftalik
        </span>
        <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400">
          Haftalik
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart
          data={DATA}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="swapsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#3B82F6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            tick={{ fill: '#6B7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 40]}
            ticks={[0, 10, 20, 30, 40]}
            tick={{ fill: '#6B7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: '#374151', strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="swaps"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#swapsGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#3B82F6', stroke: '#1E1E2D', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
