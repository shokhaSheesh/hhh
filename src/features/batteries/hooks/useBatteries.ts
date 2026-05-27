import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { Battery, BatteriesListResponse } from '@/types/batteries';

const api = createApi(VIEW.batteries);

// Range values: 'low' = 0-49, 'mid' = 50-74, 'high' = 75-100
function inRange(value: number, range: string): boolean {
  if (range === 'low')  return value <= 49;
  if (range === 'mid')  return value >= 50 && value <= 74;
  if (range === 'high') return value >= 75;
  return true;
}

interface UseBatteriesParams {
  page:       number;
  limit:      number;
  search?:    string;
  socRange?:  string | null;
  sohRange?:  string | null;
}

interface UseBatteriesResult {
  batteries: Battery[];
  total:     number;
  loading:   boolean;
  error:     string | null;
}

export function useBatteries({ page, limit, search = '', socRange, sohRange }: UseBatteriesParams): UseBatteriesResult {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const q = search.trim().toLowerCase();
    const needsClientFilter = !!(q || socRange || sohRange);
    const body = needsClientFilter
      ? { offset: 0, limit: 1000 }
      : { offset: (page - 1) * limit, limit };

    api
      .post<BatteriesListResponse>('/batteries/items/list', { data: body })
      .then((res) => {
        if (cancelled) return;
        const all = res.data.data.response ?? [];
        if (needsClientFilter) {
          const filtered = all.filter((b) => {
            if (q && !b.battery_sn.toLowerCase().includes(q)) return false;
            if (socRange && !inRange(b.soc, socRange)) return false;
            if (sohRange && !inRange(b.soh, sohRange)) return false;
            return true;
          });
          setBatteries(filtered.slice((page - 1) * limit, page * limit));
          setTotal(filtered.length);
        } else {
          setBatteries(all);
          setTotal(res.data.data.count ?? 0);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, search, socRange, sohRange]);

  return { batteries, total, loading, error };
}
