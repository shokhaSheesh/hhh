import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { Admin, AdminsListResponse } from '@/types/admins';

const api = createApi(VIEW.admins);

const ROW_VIEW_ID = '8c4a0ef0-152a-4edf-93eb-9895e5649cc0';

interface UseAdminsParams {
  page:    number;
  limit:   number;
  search?: string;
}

interface UseAdminsResult {
  admins:  Admin[];
  total:   number;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useAdmins({ page, limit, search = '' }: UseAdminsParams): UseAdminsResult {
  const [admins,  setAdmins]  = useState<Admin[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .post<AdminsListResponse>('/admins/items/list', {
        data: {
          row_view_id: ROW_VIEW_ID,
          offset:      (page - 1) * limit,
          limit,
          search:      search.trim(),
          order:       {},
          view_fields: [],
        },
      })
      .then((res) => {
        if (cancelled) return;
        setAdmins(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, search, tick]);

  return { admins, total, loading, error, refetch };
}
