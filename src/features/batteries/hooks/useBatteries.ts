import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { Battery, BatteriesListResponse } from '@/types/batteries';

const api = createApi(VIEW.batteries);

interface UseBatteriesParams {
  page:  number;
  limit: number;
}

interface UseBatteriesResult {
  batteries: Battery[];
  total:     number;
  loading:   boolean;
  error:     string | null;
}

export function useBatteries({ page, limit }: UseBatteriesParams): UseBatteriesResult {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .post<BatteriesListResponse>('/batteries/items/list', {
        data: { offset: (page - 1) * limit, limit },
      })
      .then((res) => {
        if (cancelled) return;
        setBatteries(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit]);

  return { batteries, total, loading, error };
}
