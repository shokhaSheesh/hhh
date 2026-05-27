import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { Penalty, PenaltiesListResponse } from '@/types/penalties';

const penaltiesApi = createApi(VIEW.penalties);

interface UsePenaltiesParams {
  page:    number;
  limit:   number;
  userId?: string;
}

interface UsePenaltiesResult {
  penalties: Penalty[];
  total:     number;
  loading:   boolean;
  error:     string | null;
}

export function usePenalties({ page, limit, userId }: UsePenaltiesParams): UsePenaltiesResult {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = { offset: (page - 1) * limit, limit };
    if (userId) body['users_id'] = userId;

    penaltiesApi
      .post<PenaltiesListResponse>('/penalties/items/list', { data: body })
      .then((res) => {
        if (cancelled) return;
        setPenalties(res.data?.data?.response ?? []);
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

  return { penalties, total, loading, error };
}
