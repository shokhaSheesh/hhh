import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import type { User, UsersListResponse } from '@/types/user';

interface UseUsersOptions {
  page:   number;
  limit:  number;
  search: string;
  tick?:  number;
}

interface UseUsersResult {
  users:   User[];
  total:   number;
  loading: boolean;
  error:   string | null;
}

export function useUsers({ page, limit, search, tick = 0 }: UseUsersOptions): UseUsersResult {
  const [users,   setUsers]   = useState<User[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    // Ucode view-list endpoint: POST with pagination in body
    const offset = (page - 1) * limit;
    const data: Record<string, unknown> = { offset, limit };
    if (search.trim()) data['search'] = search.trim();

    api
      .post<UsersListResponse>('/users/items/list', { data })
      .then((res) => {
        if (cancelled) return;
        setUsers(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Show the exact Ucode error text so format issues are visible
        setError(err instanceof Error ? err.message : 'Noma\'lum xatolik');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, search, tick]);

  return { users, total, loading, error };
}
