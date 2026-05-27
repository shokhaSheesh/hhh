import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { UserOperation, UserOperationsListResponse } from '@/types/userOperations';
import type { TariffsListResponse } from '@/types/tariffs';

const api        = createApi(VIEW.userOperations);
const tariffsApi = createApi(VIEW.tariffs);

const VIEW_ID = '2746c785-91eb-4afd-8624-ad80215e7e38';
const LIMIT   = 20;

// Module-level cache — tariffs are fetched once per session
let _tariffCache: Record<string, string> | null = null;
let _tariffFlight: Promise<Record<string, string>> | null = null;

function loadTariffNames(): Promise<Record<string, string>> {
  if (_tariffCache) return Promise.resolve(_tariffCache);
  if (_tariffFlight) return _tariffFlight;

  _tariffFlight = tariffsApi
    .post<TariffsListResponse>('/tariffs/items/list', { data: { offset: 0, limit: 100 } })
    .then((res) => {
      const map: Record<string, string> = {};
      for (const t of res.data.data.response ?? []) map[t.guid] = t.name;
      _tariffCache = map;
      return map;
    })
    .finally(() => { _tariffFlight = null; });

  return _tariffFlight;
}

interface UseUserOperationsParams {
  page:      number;
  userId?:   string;
  opType?:   string | null;
}

interface UseUserOperationsResult {
  operations:  UserOperation[];
  tariffNames: Record<string, string>;
  total:       number;
  loading:     boolean;
  error:       string | null;
}

export function useUserOperations({ page, userId, opType }: UseUserOperationsParams): UseUserOperationsResult {
  const [operations,  setOperations]  = useState<UserOperation[]>([]);
  const [tariffNames, setTariffNames] = useState<Record<string, string>>({});
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = {
      row_view_id: VIEW_ID,
      offset:      (page - 1) * LIMIT,
      limit:       LIMIT,
      order:       {},
      view_fields: [],
    };
    if (userId) body['users_id'] = userId;
    if (opType) body['type'] = [opType];

    Promise.all([
      api.post<UserOperationsListResponse>('/user_operations/items/list', { data: body }),
      loadTariffNames(),
    ])
      .then(([res, names]) => {
        if (cancelled) return;
        setOperations(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setTariffNames(names);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, userId, opType]);

  return { operations, tariffNames, total, loading, error };
}
