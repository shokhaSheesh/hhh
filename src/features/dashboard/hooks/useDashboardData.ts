import { useState, useEffect } from 'react';

export type DashboardTab = 'payments' | 'users' | 'stations' | 'rentals';

// ─── Card-level endpoints ──────────────────────────────────────────────────────

export const CARD_URLS = {
  paymentsRevenue:
    'https://metabase.u-code.io/api/public/dashboard/3c80580b-e456-45d1-91a1-ad864346f711/dashcard/641/card/630?parameters=%5B%7B%22type%22%3A%22string%2F%3D%22%2C%22value%22%3A%5B%22month%22%5D%2C%22id%22%3A%22cbec4ed7%22%2C%22target%22%3A%5B%22variable%22%2C%5B%22template-tag%22%2C%22date_granularity%22%5D%5D%7D%5D',
  paymentsTariffMetrics:
    'https://metabase.u-code.io/api/public/dashboard/3c80580b-e456-45d1-91a1-ad864346f711/dashcard/631/card/622?parameters=%5B%7B%22type%22%3A%22date%2Fmonth-year%22%2C%22value%22%3Anull%2C%22id%22%3A%228abef0b0%22%2C%22target%22%3A%5B%22dimension%22%2C%5B%22template-tag%22%2C%22active_from%22%5D%2C%7B%22stage-number%22%3A0%7D%5D%7D%5D',
  rentalsVolume:
    'https://metabase.u-code.io/api/public/dashboard/d6a3cbf6-c40f-4ab7-b747-bff27b39262f/dashcard/624/card/614?parameters=%5B%7B%22type%22%3A%22string%2F%3D%22%2C%22value%22%3A%5B%22month%22%5D%2C%22id%22%3A%22bf93421e%22%2C%22target%22%3A%5B%22variable%22%2C%5B%22template-tag%22%2C%22date_granularity%22%5D%5D%7D%5D',
  usersGrowth:
    'https://metabase.u-code.io/api/public/dashboard/97031109-8e4f-4786-9898-22ae28887f1a/dashcard/625/card/616?parameters=%5B%7B%22type%22%3A%22date%2Fmonth-year%22%2C%22value%22%3Anull%2C%22id%22%3A%22b7bff79a%22%2C%22target%22%3A%5B%22dimension%22%2C%5B%22template-tag%22%2C%22last_verified_time%22%5D%2C%7B%22stage-number%22%3A0%7D%5D%7D%2C%7B%22type%22%3A%22string%2F%3D%22%2C%22value%22%3A%5B%22month%22%5D%2C%22id%22%3A%224b5e0c2a%22%2C%22target%22%3A%5B%22variable%22%2C%5B%22template-tag%22%2C%22date_granularity%22%5D%5D%7D%5D',
  stationsLeaderboard:
    'https://metabase.u-code.io/api/public/dashboard/ec0ff3e6-0644-442c-bfa3-a23c9c7f58f9/dashcard/642/card/631?parameters=%5B%5D',
} as const;

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface MetabaseCol {
  name:      string;
  base_type: string;
}

// ─── parseTariffData ───────────────────────────────────────────────────────────
// Pivots rows of [period, tariff_name, revenue, count] into Recharts-ready
// objects grouped by date, with each unique tariff_name as a keyed field.

export interface TariffPoint {
  date: string;
  [tariffName: string]: string | number;
}

export function parseTariffData(rows: unknown[][]): {
  data:    TariffPoint[];
  tariffs: string[];
} {
  const UZ_SHORT = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];

  function fmtShort(iso: string): string {
    const d = new Date(iso);
    return `${UZ_SHORT[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
  }

  // Preserve insertion order for dates
  const dateMap = new Map<string, Record<string, number>>();
  const tariffSet = new Set<string>();

  for (const row of rows) {
    const [isoDate, tariffName, revenue] = row as [string, string | null, number, number];
    if (!isoDate || !tariffName) continue;

    const key = fmtShort(isoDate);
    if (!dateMap.has(key)) dateMap.set(key, {});
    const bucket = dateMap.get(key)!;
    bucket[tariffName] = Math.round(revenue);
    tariffSet.add(tariffName);
  }

  const data = Array.from(dateMap.entries()).map(([date, values]) => ({
    date,
    ...values,
  }));

  return { data, tariffs: Array.from(tariffSet) };
}

// ─── parseTariffMetrics ────────────────────────────────────────────────────────
// Maps the 11-column aggregate rows to typed objects; drops null-name rows.

export interface TariffMetric {
  tariff_name:           string;
  tariff_key:            string;
  total_subscriptions:   number;
  active_now:            number;
  gross_revenue:         number;
  promo_discounts_given: number;
  net_revenue:           number;
  avg_subscription_value: number;
  revenue_share_pct:     number;
  unique_customers:      number;
  revenue_per_customer:  number | null;
}

export function parseTariffMetrics(rows: unknown[][]): TariffMetric[] {
  return rows
    .filter((row) => row[0] != null)
    .map((row) => ({
      tariff_name:            row[0]  as string,
      tariff_key:             row[1]  as string,
      total_subscriptions:    Math.round((row[2]  as number) ?? 0),
      active_now:             Math.round((row[3]  as number) ?? 0),
      gross_revenue:          Math.round((row[4]  as number) ?? 0),
      promo_discounts_given:  Math.round((row[5]  as number) ?? 0),
      net_revenue:            Math.round((row[6]  as number) ?? 0),
      avg_subscription_value: (row[7]  as number) ?? 0,
      revenue_share_pct:      (row[8]  as number) ?? 0,
      unique_customers:       Math.round((row[9]  as number) ?? 0),
      revenue_per_customer:   row[10] != null ? (row[10] as number) : null,
    }));
}

// ─── parseRentalMetrics ────────────────────────────────────────────────────────
// Maps 6-column rental rows; sorts chronologically (oldest → newest).

export interface RentalMetric {
  period:               string;
  periodRaw:            string;
  total_rentals:        number;
  active_rentals:       number;
  completed_rentals:    number;
  avg_duration_minutes: number;
  avg_duration_hours:   number;
}

export function parseRentalMetrics(rows: unknown[][]): RentalMetric[] {
  const UZ_MONTHS = [
    'Yanvar','Fevral','Mart','Aprel','May','Iyun',
    'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr',
  ];

  return rows
    .map((row) => {
      const iso = row[0] as string;
      const d   = new Date(iso);
      return {
        period:               `${UZ_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
        periodRaw:            iso,
        total_rentals:        Math.round((row[1] as number) ?? 0),
        active_rentals:       Math.round((row[2] as number) ?? 0),
        completed_rentals:    Math.round((row[3] as number) ?? 0),
        avg_duration_minutes: (row[4] as number) ?? 0,
        avg_duration_hours:   (row[5] as number) ?? 0,
      };
    })
    .sort((a, b) => new Date(a.periodRaw).getTime() - new Date(b.periodRaw).getTime());
}

// ─── parseUserMetrics ─────────────────────────────────────────────────────────
// Maps 4-column user rows; sorts chronologically (oldest → newest).

export interface UserMetric {
  period:               string;
  periodRaw:            string;
  total_verified_users: number;
  active_users:         number;
  inactive_users:       number;
}

export function parseUserMetrics(rows: unknown[][]): UserMetric[] {
  const UZ_MONTHS = [
    'Yanvar','Fevral','Mart','Aprel','May','Iyun',
    'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr',
  ];

  return rows
    .map((row) => {
      const iso = row[0] as string;
      const d   = new Date(iso);
      return {
        period:               `${UZ_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
        periodRaw:            iso,
        total_verified_users: Math.round((row[1] as number) ?? 0),
        active_users:         Math.round((row[2] as number) ?? 0),
        inactive_users:       Math.round((row[3] as number) ?? 0),
      };
    })
    .sort((a, b) => new Date(a.periodRaw).getTime() - new Date(b.periodRaw).getTime());
}

// ─── parseTopStations ─────────────────────────────────────────────────────────
// Maps 5-column station rows; sorts desc by total_swaps; keeps top 10.

export interface TopStation {
  station_name:  string;
  total_swaps:   number;
  unique_users:  number;
}

export function parseTopStations(rows: unknown[][]): TopStation[] {
  return rows
    .filter((row) => row[0] != null)
    .map((row) => ({
      station_name: row[0] as string,
      total_swaps:  Math.round((row[3] as number) ?? 0),
      unique_users: Math.round((row[4] as number) ?? 0),
    }))
    .sort((a, b) => b.total_swaps - a.total_swaps)
    .slice(0, 10);
}

// ─── Generic card fetcher ──────────────────────────────────────────────────────

interface UseCardDataResult {
  rows:    unknown[][];
  cols:    MetabaseCol[];
  loading: boolean;
  error:   string | null;
}

export function useCardData(url: string): UseCardDataResult {
  const [rows,    setRows]    = useState<unknown[][]>([]);
  const [cols,    setCols]    = useState<MetabaseCol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setRows([]);
    setCols([]);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<unknown>;
      })
      .then((json) => {
        if (cancelled) return;
        console.log('[MetabaseCard] raw response:', json);
        const j    = json as Record<string, unknown>;
        const data = j['data'] as Record<string, unknown> | undefined;
        if (data && Array.isArray(data['rows']) && Array.isArray(data['cols'])) {
          setRows(data['rows'] as unknown[][]);
          setCols(data['cols'] as MetabaseCol[]);
        } else {
          console.warn('[MetabaseCard] unexpected shape:', json);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('[MetabaseCard] fetch error:', err);
        setError(err instanceof Error ? err.message : 'Xatolik');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [url]);

  return { rows, cols, loading, error };
}
