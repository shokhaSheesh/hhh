import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { Promocode, PromocodesListResponse } from '@/types/promocodes';

const promocodesApi = createApi(VIEW.promocodes);

interface UsePromocodesResult {
  promocodes: Promocode[];
  total:      number;
  loading:    boolean;
  error:      string | null;
}

export function usePromocodes(): UsePromocodesResult {
  const [promocodes, setPromocodes] = useState<Promocode[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    promocodesApi
      .post<PromocodesListResponse>('/promocodes/items/list', { data: { offset: 0, limit: 100 } })
      .then((res) => {
        if (cancelled) return;
        setPromocodes(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { promocodes, total, loading, error };
}
