import { useState } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  ComposedChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import { useCardData, parseTariffMetrics, parseRentalMetrics, parseUserMetrics, parseTopStations, CARD_URLS } from './hooks/useDashboardData';
import type { DashboardTab } from './hooks/useDashboardData';

// ─── Tab config ────────────────────────────────────────────────────────────────

const TABS: { id: DashboardTab; label: string }[] = [
  { id: 'payments', label: "To'lovlar"      },
  { id: 'users',    label: 'Mijozlar'       },
  { id: 'stations', label: 'Stansiyalar'    },
  { id: 'rentals',  label: 'Almashtirishlar'},
];

// ─── Date / number formatters ──────────────────────────────────────────────────

const UZ_MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const UZ_SHORT  = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];

function fmtMonthShort(iso: string): string {
  const d = new Date(iso);
  return `${UZ_SHORT[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
}

function fmtMonthLong(iso: string): string {
  const d = new Date(iso);
  return `${UZ_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function fmtAxisRevenue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function fmtUZS(v: number): string {
  return `${v.toLocaleString('ru-RU')} UZS`;
}

// ─── Revenue tooltip ───────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-dark-border bg-[#16161D] px-4 py-3 shadow-2xl">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-white">{fmtUZS(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

// ─── Shared skeleton ───────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-6">
      <div className="mb-5 space-y-2">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-800" />
        <div className="h-3 w-24 animate-pulse rounded bg-gray-800" />
      </div>
      <div className="h-64 w-full animate-pulse rounded-xl bg-gray-800/50" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dark-border bg-dark-surface">
      <AlertCircle className="h-9 w-9 text-red-500/60" strokeWidth={1.5} />
      <p className="text-sm font-medium text-red-400">{message}</p>
    </div>
  );
}

function ComingSoon({ tab }: { tab: DashboardTab }) {
  const labels: Record<DashboardTab, string> = {
    payments: "To'lovlar", users: 'Mijozlar',
    stations: 'Stansiyalar', rentals: 'Almashtirishlar',
  };
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dark-border bg-dark-surface">
      <p className="text-sm font-semibold text-white">{labels[tab]}</p>
      <p className="mt-1 text-xs text-gray-600">Tez orada...</p>
    </div>
  );
}

// ─── Revenue AreaChart card ────────────────────────────────────────────────────

function RevenueChart({ rows }: { rows: unknown[][] }) {
  const chartData = (rows as [string, number][]).map(([iso, revenue]) => ({
    date:     fmtMonthShort(iso),
    dateLong: fmtMonthLong(iso),
    revenue:  Math.round(revenue),
  }));

  const total = chartData.reduce((s, d) => s + d.revenue, 0);
  const peak  = chartData.reduce(
    (max, d) => (d.revenue > max.revenue ? d : max),
    chartData[0] ?? { date: '', dateLong: '', revenue: 0 },
  );

  return (
    <>
      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <p className="text-xs font-medium text-gray-500">Jami tushum</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{fmtUZS(total)}</p>
          <p className="mt-0.5 text-xs text-gray-600">
            {chartData[0]?.dateLong} — {chartData.at(-1)?.dateLong}
          </p>
        </div>
        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <p className="text-xs font-medium text-gray-500">Eng yuqori oy</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{fmtUZS(peak.revenue)}</p>
          <p className="mt-0.5 text-xs text-gray-600">{peak.dateLong}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-dark-border bg-dark-surface p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Oylik tushum dinamikasi</h2>
            <p className="mt-0.5 text-xs text-gray-500">UZS — real ma'lumotlar</p>
          </div>
          <span className="rounded-full border border-dark-border bg-gray-900/60 px-3 py-1 text-xs font-medium text-gray-400">
            Oylik
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#D1F22D" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#D1F22D" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#1C1C27" strokeDasharray="4 4" />
            <XAxis dataKey="date" tick={{ fill: '#4B5563', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={fmtAxisRevenue} tick={{ fill: '#4B5563', fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
            <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#2D2D3A', strokeWidth: 1 }} />
            <Area
              type="monotone" dataKey="revenue" stroke="#D1F22D" strokeWidth={2.5}
              fill="url(#revenueGrad)"
              dot={{ r: 4, fill: '#D1F22D', stroke: '#16161D', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#D1F22D', stroke: '#16161D', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

// ─── Tariff metrics ComposedChart ──────────────────────────────────────────────

const METRICS_LEGEND = [
  { key: 'gross_revenue', label: 'Umumiy tushum', color: '#334155' },
  { key: 'net_revenue',   label: 'Sof tushum',    color: '#D1F22D' },
  { key: 'active_now',   label: 'Faol mijozlar',  color: '#A855F7' },
];

function TariffMetricsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const getEntry = (key: string) => payload.find((p: any) => p.dataKey === key);
  const gross  = getEntry('gross_revenue');
  const net    = getEntry('net_revenue');
  const active_ = getEntry('active_now');

  return (
    <div className="min-w-[230px] rounded-xl border border-dark-border bg-[#16161D] px-4 py-3 shadow-2xl">
      <p className="mb-3 text-xs font-semibold text-gray-300">{label}</p>
      <div className="space-y-2">
        {gross && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-[#334155]" />
              <span className="text-xs text-gray-400">Umumiy tushum</span>
            </div>
            <span className="text-xs font-semibold text-white">{fmtUZS(gross.value ?? 0)}</span>
          </div>
        )}
        {net && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-[#D1F22D]" />
              <span className="text-xs text-gray-400">Sof tushum</span>
            </div>
            <span className="text-xs font-semibold text-white">{fmtUZS(net.value ?? 0)}</span>
          </div>
        )}
        {active_ && (
          <div className="flex items-center justify-between gap-6 border-t border-dark-border pt-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#A855F7]" />
              <span className="text-xs text-gray-400">Faol mijozlar</span>
            </div>
            <span className="text-xs font-semibold text-white">
              {(active_.value ?? 0).toLocaleString('ru-RU')} ta
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TariffMetricsChart({ rows }: { rows: unknown[][] }) {
  const metrics = parseTariffMetrics(rows);

  if (metrics.length === 0) return null;

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Tariflar Tahlili</h2>
          <p className="mt-0.5 text-xs text-gray-500">Tarif bo'yicha daromad va faol mijozlar</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4">
        {METRICS_LEGEND.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 shrink-0 ${key === 'active_now' ? 'rounded-full' : 'rounded-sm'}`}
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={metrics} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="#1C1C27" strokeDasharray="4 4" />

          <XAxis
            dataKey="tariff_name"
            tick={{ fill: '#4B5563', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />

          {/* Left Y — revenue */}
          <YAxis
            yAxisId="left"
            tickFormatter={fmtAxisRevenue}
            tick={{ fill: '#4B5563', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={52}
          />

          {/* Right Y — user count */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#4B5563', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />

          <Tooltip content={<TariffMetricsTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend content={() => null} />

          <Bar
            yAxisId="left"
            dataKey="gross_revenue"
            name="Umumiy tushum"
            fill="#334155"
            radius={[6, 6, 0, 0]}
            barSize={48}
          />
          <Bar
            yAxisId="left"
            dataKey="net_revenue"
            name="Sof tushum"
            fill="#D1F22D"
            radius={[6, 6, 0, 0]}
            barSize={48}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="active_now"
            name="Faol mijozlar"
            stroke="#A855F7"
            strokeWidth={3}
            dot={{ r: 6, fill: '#A855F7', stroke: '#16161D', strokeWidth: 2 }}
            activeDot={{ r: 8, fill: '#A855F7', stroke: '#16161D', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Payments tab ──────────────────────────────────────────────────────────────

function PaymentsTab() {
  const revenue = useCardData(CARD_URLS.paymentsRevenue);
  const metrics = useCardData(CARD_URLS.paymentsTariffMetrics);

  return (
    <div className="space-y-4">
      {revenue.loading ? <ChartSkeleton /> : revenue.error ? <ErrorState message={revenue.error} /> : <RevenueChart rows={revenue.rows} />}
      {metrics.loading ? <ChartSkeleton /> : metrics.error ? <ErrorState message={metrics.error} /> : <TariffMetricsChart rows={metrics.rows} />}
    </div>
  );
}

// ─── Rentals stacked BarChart ──────────────────────────────────────────────────

const RENTALS_LEGEND = [
  { key: 'completed_rentals', label: 'Yakunlangan', color: '#D1F22D' },
  { key: 'active_rentals',    label: 'Faol',         color: '#3B82F6' },
];

function RentalsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const completed = payload.find((p: any) => p.dataKey === 'completed_rentals');
  const activePay = payload.find((p: any) => p.dataKey === 'active_rentals');
  const total     = (completed?.value ?? 0) + (activePay?.value ?? 0);

  return (
    <div className="min-w-[200px] rounded-xl border border-dark-border bg-[#16161D] px-4 py-3 shadow-2xl">
      <p className="mb-2.5 text-xs font-semibold text-gray-300">{label}</p>
      <div className="space-y-1.5">
        {completed && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-[#D1F22D]" />
              <span className="text-xs text-gray-400">Yakunlangan</span>
            </div>
            <span className="text-xs font-semibold text-white">
              {(completed.value ?? 0).toLocaleString('ru-RU')} ta
            </span>
          </div>
        )}
        {activePay && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-[#3B82F6]" />
              <span className="text-xs text-gray-400">Faol</span>
            </div>
            <span className="text-xs font-semibold text-white">
              {(activePay.value ?? 0).toLocaleString('ru-RU')} ta
            </span>
          </div>
        )}
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-dark-border pt-2.5">
        <span className="text-xs text-gray-500">Jami</span>
        <span className="text-xs font-bold text-white">{total.toLocaleString('ru-RU')} ta</span>
      </div>
    </div>
  );
}

function RentalsChart({ rows }: { rows: unknown[][] }) {
  const data = parseRentalMetrics(rows);

  if (data.length === 0) return null;

  const latest = data.at(-1)!;
  const totalAll = data.reduce((s, d) => s + d.total_rentals, 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <p className="text-xs font-medium text-gray-500">So'nggi oy — jami almashtirishlar</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">
            {latest.total_rentals.toLocaleString('ru-RU')} ta
          </p>
          <p className="mt-0.5 text-xs text-gray-600">{latest.period}</p>
        </div>
        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <p className="text-xs font-medium text-gray-500">O'rtacha ijara muddati</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">
            {latest.avg_duration_hours.toFixed(1)} soat
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            {latest.avg_duration_minutes.toFixed(0)} daqiqa · {latest.period}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-dark-border bg-dark-surface p-6">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Almashtirishlar hajmi</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Oylik · Jami: {totalAll.toLocaleString('ru-RU')} ta
            </p>
          </div>
          <span className="rounded-full border border-dark-border bg-gray-900/60 px-3 py-1 text-xs font-medium text-gray-400">
            Stacked
          </span>
        </div>

        {/* Legend */}
        <div className="mb-4 mt-3 flex gap-4">
          {RENTALS_LEGEND.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }} barSize={40}>
            <CartesianGrid vertical={false} stroke="#1C1C27" strokeDasharray="4 4" />
            <XAxis
              dataKey="period"
              tick={{ fill: '#4B5563', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#4B5563', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<RentalsTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend content={() => null} />
            <Bar dataKey="completed_rentals" name="Yakunlangan" stackId="a" fill="#D1F22D" />
            <Bar dataKey="active_rentals"    name="Faol"         stackId="a" fill="#3B82F6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RentalsTab() {
  const { rows, loading, error } = useCardData(CARD_URLS.rentalsVolume);
  if (loading) return <ChartSkeleton />;
  if (error)   return <ErrorState message={error} />;
  return <RentalsChart rows={rows} />;
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UserGrowthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-dark-border bg-[#16161D] px-4 py-3 shadow-2xl">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-white">
        {(payload[0]?.value ?? 0).toLocaleString('ru-RU')} ta
      </p>
    </div>
  );
}

function UserActivityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const activePay   = payload.find((p: any) => p.dataKey === 'active_users');
  const inactivePay = payload.find((p: any) => p.dataKey === 'inactive_users');
  return (
    <div className="min-w-[190px] rounded-xl border border-dark-border bg-[#16161D] px-4 py-3 shadow-2xl">
      <p className="mb-2.5 text-xs font-semibold text-gray-300">{label}</p>
      <div className="space-y-1.5">
        {activePay && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-[#10B981]" />
              <span className="text-xs text-gray-400">Faol</span>
            </div>
            <span className="text-xs font-semibold text-white">
              {(activePay.value ?? 0).toLocaleString('ru-RU')} ta
            </span>
          </div>
        )}
        {inactivePay && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-[#374151]" />
              <span className="text-xs text-gray-400">Nofaol</span>
            </div>
            <span className="text-xs font-semibold text-white">
              {(inactivePay.value ?? 0).toLocaleString('ru-RU')} ta
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function UsersContent({ rows }: { rows: unknown[][] }) {
  const data = parseUserMetrics(rows);
  if (data.length === 0) return null;

  const latest   = data.at(-1)!;
  const totalAll = data.reduce((s, d) => s + d.total_verified_users, 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <p className="text-xs font-medium text-gray-500">Jami tasdiqlangan</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">
            {latest.total_verified_users.toLocaleString('ru-RU')} ta
          </p>
          <p className="mt-0.5 text-xs text-gray-600">{latest.period}</p>
        </div>
        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <p className="text-xs font-medium text-gray-500">Faol mijozlar</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-400">
            {latest.active_users.toLocaleString('ru-RU')} ta
          </p>
          <p className="mt-0.5 text-xs text-gray-600">{latest.period}</p>
        </div>
        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <p className="text-xs font-medium text-gray-500">Nofaol mijozlar</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-gray-400">
            {latest.inactive_users.toLocaleString('ru-RU')} ta
          </p>
          <p className="mt-0.5 text-xs text-gray-600">{latest.period}</p>
        </div>
      </div>

      {/* Growth AreaChart */}
      <div className="rounded-2xl border border-dark-border bg-dark-surface p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Foydalanuvchi o'sishi</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Tasdiqlangan · Jami: {totalAll.toLocaleString('ru-RU')} ta
            </p>
          </div>
          <span className="rounded-full border border-dark-border bg-gray-900/60 px-3 py-1 text-xs font-medium text-gray-400">
            Oylik
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#D1F22D" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#D1F22D" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#1C1C27" strokeDasharray="4 4" />
            <XAxis dataKey="period" tick={{ fill: '#4B5563', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#4B5563', fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
            <Tooltip content={<UserGrowthTooltip />} cursor={{ stroke: '#2D2D3A', strokeWidth: 1 }} />
            <Area
              type="monotone" dataKey="total_verified_users"
              stroke="#D1F22D" strokeWidth={2.5}
              fill="url(#usersGrad)"
              dot={{ r: 4, fill: '#D1F22D', stroke: '#16161D', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#D1F22D', stroke: '#16161D', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Active vs Inactive BarChart */}
      <div className="rounded-2xl border border-dark-border bg-dark-surface p-6">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Faol vs Nofaol mijozlar</h2>
            <p className="mt-0.5 text-xs text-gray-500">Oylik taqqoslama</p>
          </div>
        </div>

        <div className="mb-4 mt-3 flex gap-4">
          {[
            { color: '#10B981', label: 'Faol' },
            { color: '#374151', label: 'Nofaol' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }} barGap={4} barSize={28}>
            <CartesianGrid vertical={false} stroke="#1C1C27" strokeDasharray="4 4" />
            <XAxis dataKey="period" tick={{ fill: '#4B5563', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#4B5563', fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
            <Tooltip content={<UserActivityTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend content={() => null} />
            <Bar dataKey="active_users"   name="Faol"   fill="#10B981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="inactive_users" name="Nofaol" fill="#374151" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function UsersTab() {
  const { rows, loading, error } = useCardData(CARD_URLS.usersGrowth);
  if (loading) return <ChartSkeleton />;
  if (error)   return <ErrorState message={error} />;
  return <UsersContent rows={rows} />;
}

// ─── Stations leaderboard ─────────────────────────────────────────────────────

function StationsTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const swaps = payload.find((p) => p.dataKey === 'total_swaps');
  const users = payload.find((p) => p.dataKey === 'unique_users');
  return (
    <div className="min-w-[210px] rounded-xl border border-dark-border bg-[#16161D] px-4 py-3 shadow-2xl">
      <p className="mb-2.5 truncate text-xs font-semibold text-gray-300">{label}</p>
      <div className="space-y-1.5">
        {swaps && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-[#D1F22D]" />
              <span className="text-xs text-gray-400">Almashtirishlar</span>
            </div>
            <span className="text-xs font-semibold text-white">
              {(swaps.value ?? 0).toLocaleString('ru-RU')} ta
            </span>
          </div>
        )}
        {users && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm bg-[#3B82F6]" />
              <span className="text-xs text-gray-400">Noyob mijozlar</span>
            </div>
            <span className="text-xs font-semibold text-white">
              {(users.value ?? 0).toLocaleString('ru-RU')} ta
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StationsContent({ rows }: { rows: unknown[][] }) {
  const stations = parseTopStations(rows);
  if (stations.length === 0) return null;

  const top = stations[0];
  // Reverse for vertical chart so #1 renders at the top
  const chartData = [...stations].reverse();

  return (
    <div className="space-y-4">
      {/* Top station hero card */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-dark-border bg-dark-surface p-5">
        <div>
          <p className="text-xs font-medium text-gray-500">Eng faol stansiya</p>
          <p className="mt-1 text-xl font-bold text-white">{top.station_name}</p>
          <p className="mt-0.5 text-xs text-gray-600">
            {top.total_swaps.toLocaleString('ru-RU')} almashtirish ·{' '}
            {top.unique_users.toLocaleString('ru-RU')} noyob mijoz
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lime/10">
          <span className="text-2xl font-black text-brand-lime">#1</span>
        </div>
      </div>

      {/* Horizontal leaderboard */}
      <div className="rounded-2xl border border-dark-border bg-dark-surface p-6">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Stansiyalar reytingi</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Top {stations.length} · almashtirishlar soni bo'yicha
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4 mt-3 flex gap-4">
          {[
            { color: '#D1F22D', label: 'Jami almashtirishlar' },
            { color: '#3B82F6', label: 'Noyob mijozlar' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={stations.length * 56 + 20}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            barGap={3}
            barSize={14}
          >
            <CartesianGrid horizontal={false} stroke="#1C1C27" strokeDasharray="4 4" />
            <YAxis
              dataKey="station_name"
              type="category"
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={130}
            />
            <XAxis
              type="number"
              tick={{ fill: '#4B5563', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<StationsTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Legend content={() => null} />
            <Bar dataKey="total_swaps"  name="Jami almashtirishlar" fill="#D1F22D" radius={[0, 6, 6, 0]} />
            <Bar dataKey="unique_users" name="Noyob mijozlar"        fill="#3B82F6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StationsTab() {
  const { rows, loading, error } = useCardData(CARD_URLS.stationsLeaderboard);
  if (loading) return <ChartSkeleton />;
  if (error)   return <ErrorState message={error} />;
  return <StationsContent rows={rows} />;
}

// ─── Tab router ────────────────────────────────────────────────────────────────

function TabContent({ tab }: { tab: DashboardTab }) {
  switch (tab) {
    case 'payments': return <PaymentsTab />;
    case 'rentals':  return <RentalsTab />;
    case 'users':    return <UsersTab />;
    case 'stations': return <StationsTab />;
    default:         return <ComingSoon tab={tab} />;
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [active, setActive] = useState<DashboardTab>('payments');

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-500">Wolter Admin</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white">Boshqaruv paneli</h1>
      </div>

      {/* Tab bar */}
      <div className="flex items-end gap-1 border-b border-dark-border">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={[
                'relative px-4 pb-3 pt-1 text-sm font-semibold transition-colors duration-150',
                isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300',
              ].join(' ')}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-brand-lime" />
              )}
            </button>
          );
        })}
      </div>

      <TabContent tab={active} />
    </div>
  );
}
