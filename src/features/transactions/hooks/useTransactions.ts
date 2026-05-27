import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { Transaction, TransactionsListResponse } from '@/types/transactions';

const api = createApi(VIEW.transactions);

interface UseTransactionsParams {
  page:   number;
  limit:  number;
  userId?: string;
}

interface UseTransactionsResult {
  transactions: Transaction[];
  total:        number;
  loading:      boolean;
  error:        string | null;
}

export function useTransactions({ page, limit, userId }: UseTransactionsParams): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = { offset: (page - 1) * limit, limit };
    if (userId) body['users_id'] = userId;

    api
      .post<TransactionsListResponse>('/transactions/items/list', { data: body })
      .then((res) => {
        if (cancelled) return;
        setTransactions(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, userId]);

  return { transactions, total, loading, error };
}
