import { useState, useEffect } from 'react';
import { createApi, VIEW, rootApi } from '@/api/client';
import type { Promocode, PromocodesListResponse } from '@/types/promocodes';

const promocodesApi = createApi(VIEW.promocodes);

export interface CreatePromocodePayload {
  key:                string;
  amount:             number | null;
  discount_percentage: number | null;
  valid_until:        string | null;
  users_id:           string | null;
  user_count:         number | null;
  use_count_per_user: number;
  infinite:           boolean;
  special:            boolean;
  status:             boolean;
}

export async function createPromocode(data: CreatePromocodePayload): Promise<void> {
  await rootApi.post('/v2/items/promocodes?from-ofs=true', {
    data,
    disable_faas: true,
  });
}

export async function updatePromocode(guid: string, data: CreatePromocodePayload): Promise<void> {
  await rootApi.put('/v2/items/promocodes?from-ofs=true', {
    data: { guid, ...data },
    disable_faas: true,
  });
}

export async function deletePromocode(guid: string): Promise<void> {
  await rootApi.delete(`/v2/items/promocodes/${guid}?from-ofs=true`, { data: { data: {} } });
}

interface UsePromocodesResult {
  promocodes: Promocode[];
  total:      number;
  loading:    boolean;
  error:      string | null;
}

export function usePromocodes(tick = 0): UsePromocodesResult {
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
  }, [tick]);

  return { promocodes, total, loading, error };
}
