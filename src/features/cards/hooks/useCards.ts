import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { Card, CardsListResponse } from '@/types/cards';

const api = createApi(VIEW.cards);

interface UseCardsParams {
  page:  number;
  limit: number;
}

interface UseCardsResult {
  cards:   Card[];
  total:   number;
  loading: boolean;
  error:   string | null;
}

export function useCards({ page, limit }: UseCardsParams): UseCardsResult {
  const [cards,   setCards]   = useState<Card[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .post<CardsListResponse>('/cards/items/list', {
        data: { offset: (page - 1) * limit, limit },
      })
      .then((res) => {
        if (cancelled) return;
        setCards(res.data.data.response ?? []);
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

  return { cards, total, loading, error };
}
