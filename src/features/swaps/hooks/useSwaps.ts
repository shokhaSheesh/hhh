import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { SwapRecord, SwapsListResponse } from '@/types/swaps';

const swapsApi = createApi(VIEW.swaps);

interface UseSwapsOptions {
  page:   number;
  limit:  number;
  search: string;
}

interface UseSwapsResult {
  swaps:   SwapRecord[];
  total:   number;
  loading: boolean;
  error:   string | null;
}

export function useSwaps({ page, limit, search }: UseSwapsOptions): UseSwapsResult {
  const [swaps,   setSwaps]   = useState<SwapRecord[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const offset = (page - 1) * limit;
    const body: Record<string, unknown> = { offset, limit };
    if (search.trim()) body['search'] = search.trim();

    swapsApi
      .post<SwapsListResponse>('/user_battery_bindings/items/list', { data: body })
      .then((res) => {
        if (cancelled) return;
        setSwaps(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, search]);

  return { swaps, total, loading, error };
}
