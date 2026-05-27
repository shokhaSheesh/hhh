import { useState, useEffect } from 'react';
import { rootApi } from '@/api/client';
import type { Coupon, UserCoupon } from '@/types/coupons';

interface PaginationParams {
  page:  number;
  limit: number;
  tick?: number;
}

interface FetchResult<T> {
  items:   T[];
  hasMore: boolean;
  loading: boolean;
  error:   string | null;
}

// ucode v2 GET can return { data: [...] } or { data: { data: [...], count: N } }
export function extractArray<T>(res: unknown): T[] {
  if (!res || typeof res !== 'object') return [];
  const r = res as Record<string, unknown>;

  // flat array at top level
  if (Array.isArray(r)) return r as T[];

  // { data: [...] }
  if (Array.isArray(r['data'])) return r['data'] as T[];

  // { data: { data: [...] } } or { data: { data: { count, response: [...] } } }
  const inner = r['data'];
  if (inner && typeof inner === 'object') {
    const i = inner as Record<string, unknown>;
    if (Array.isArray(i['data']))     return i['data']     as T[];
    if (Array.isArray(i['response'])) return i['response'] as T[];

    // { data: { data: { count, response: [...] } } }
    const deeper = i['data'];
    if (deeper && typeof deeper === 'object') {
      const d = deeper as Record<string, unknown>;
      if (Array.isArray(d['data']))     return d['data']     as T[];
      if (Array.isArray(d['response'])) return d['response'] as T[];
    }
  }

  // { response: [...] }
  if (Array.isArray(r['response'])) return r['response'] as T[];

  return [];
}

export function useCoupons({ page, limit, tick }: PaginationParams): FetchResult<Coupon> {
  const [items,   setItems]   = useState<Coupon[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const offset = (page - 1) * limit;

    rootApi
      .get<unknown>(`/v2/items/coupons?from-ofs=true&offset=${offset}&limit=${limit}`)
      .then((res) => {
        if (cancelled) return;
        const data = extractArray<Coupon>(res);
        setItems(data);
        setHasMore(data.length === limit);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, tick]);

  return { items, hasMore, loading, error };
}

export function useUserCoupons({ page, limit, tick }: PaginationParams): FetchResult<UserCoupon> {
  const [items,   setItems]   = useState<UserCoupon[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const offset = (page - 1) * limit;

    rootApi
      .get<unknown>(`/v2/items/user_coupons?from-ofs=true&offset=${offset}&limit=${limit}`)
      .then((res) => {
        if (cancelled) return;
        const data = extractArray<UserCoupon>(res);
        setItems(data);
        setHasMore(data.length === limit);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, tick]);

  return { items, hasMore, loading, error };
}
