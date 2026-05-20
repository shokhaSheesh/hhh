import { useState, useEffect } from 'react';
import { createApi, rootApi, VIEW } from '@/api/client';
import type { Appeal, AppealsListResponse } from '@/types/appeals';

const appealsApi = createApi(VIEW.appeals);

interface UseAppealsOptions {
  page:   number;
  limit:  number;
  search: string;
  tick?:  number;
}

interface UseAppealsResult {
  appeals: Appeal[];
  total:   number;
  loading: boolean;
  error:   string | null;
}

export function useAppeals({ page, limit, search, tick = 0 }: UseAppealsOptions): UseAppealsResult {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const offset = (page - 1) * limit;
    const data: Record<string, unknown> = { offset, limit };
    if (search.trim()) data['search'] = search.trim();

    appealsApi
      .post<AppealsListResponse>('/requests/items/list', { data })
      .then((res) => {
        if (cancelled) return;
        setAppeals(res.data.data.response ?? []);
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

  return { appeals, total, loading, error };
}

// Maps UI keys → strict backend slugs the DB accepts
const STATUS_MAP: Record<string, string> = {
  YANGI:      'new',
  BAJARILDI:  'solved',
  RAD_ETILDI: 'ignored',
};

export async function updateAppealStatus(appeal: Appeal, uiStatus: string): Promise<void> {
  const backendStatus = STATUS_MAP[uiStatus] ?? uiStatus;
  await rootApi.put('/v2/items/requests?from-ofs=true', {
    data: {
      guid:        appeal.guid,
      name:        appeal.name        || '',
      description: appeal.description || '',
      phone:       appeal.phone       || '',
      status:      [backendStatus],
    },
    disable_faas: true,
  });
}
