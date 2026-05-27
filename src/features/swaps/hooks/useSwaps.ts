import { useState, useEffect } from 'react';
import { createApi, rootApi, VIEW } from '@/api/client';
import type { SwapRecord, SwapStatus, SwapsListResponse } from '@/types/swaps';

const swapsApi = createApi(VIEW.swaps);

export async function updateSwapStatus(swap: SwapRecord, newStatus: SwapStatus): Promise<void> {
  await rootApi.put('/v2/items/user_battery_bindings?from-ofs=true', {
    data: {
      guid:             swap.guid,
      subscriptions_id: swap.subscriptions_id,
      batteries_id:     swap.batteries_id,
      devices_id:       swap.devices_id,
      users_id:         swap.users_id,
      bound_at:         newStatus === 'bound' ? new Date().toISOString() : swap.bound_at,
      unbound_at:       swap.unbound_at,
      status:           [newStatus],
    },
    disable_faas: true,
  });
}

interface UseSwapsOptions {
  page:          number;
  limit:         number;
  userId?:       string;
  statusFilter?: string | null;
}

interface UseSwapsResult {
  swaps:   SwapRecord[];
  total:   number;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useSwaps({ page, limit, userId, statusFilter }: UseSwapsOptions): UseSwapsResult {
  const [swaps,   setSwaps]   = useState<SwapRecord[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = { offset: (page - 1) * limit, limit };
    if (userId) body['users_id'] = userId;
    if (statusFilter) body['status'] = [statusFilter];

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
  }, [page, limit, userId, statusFilter, tick]);

  return { swaps, total, loading, error, refetch };
}
