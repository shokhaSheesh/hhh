import { useState, useEffect } from 'react';
import { createApi, VIEW, rootApi } from '@/api/client';
import type { Card, CardsListResponse } from '@/types/cards';

const api = createApi(VIEW.cards);

export async function deleteCard(guid: string): Promise<void> {
  await rootApi.delete(`/v2/items/cards/${guid}?from-ofs=true`, { data: { data: {} } });
}

interface UseCardsParams {
  page:    number;
  limit:   number;
  userId?: string;
}

interface UseCardsResult {
  cards:   Card[];
  total:   number;
  loading: boolean;
  error:   string | null;
}

export function useCards({ page, limit, userId, tick = 0 }: UseCardsParams & { tick?: number }): UseCardsResult {
  const [cards,   setCards]   = useState<Card[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = { offset: (page - 1) * limit, limit };
    if (userId) body['users_id'] = userId;

    api
      .post<CardsListResponse>('/cards/items/list', { data: body })
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
  }, [page, limit, userId, tick]);

  return { cards, total, loading, error };
}
