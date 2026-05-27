import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { Subscription, SubscriptionsListResponse } from '@/types/subscriptions';

const subscriptionsApi = createApi(VIEW.subscriptions);

interface UseSubscriptionsParams {
  page:    number;
  limit:   number;
  userId?: string;
}

interface UseSubscriptionsResult {
  subscriptions: Subscription[];
  total:         number;
  loading:       boolean;
  error:         string | null;
}

export function useSubscriptions({ page, limit, userId }: UseSubscriptionsParams): UseSubscriptionsResult {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = { offset: (page - 1) * limit, limit };
    if (userId) body['users_id'] = userId;

    subscriptionsApi
      .post<SubscriptionsListResponse>('/subscriptions/items/list', { data: body })
      .then((res) => {
        if (cancelled) return;
        setSubscriptions(res.data?.data?.response ?? []);
        setTotal(res.data?.data?.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, userId]);

  return { subscriptions, total, loading, error };
}
