import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { Station, StationsListResponse } from '@/types/stations';

const stationsApi = createApi(VIEW.stations);

interface UseStationsOptions {
  page:          number;
  limit:         number;
  search:        string;
  onlineStatus?: string | null;
}

interface UseStationsResult {
  stations: Station[];
  total:    number;
  loading:  boolean;
  error:    string | null;
}

export function useStations({ page, limit, search, onlineStatus }: UseStationsOptions): UseStationsResult {
  const [stations, setStations] = useState<Station[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const offset = (page - 1) * limit;
    const body: Record<string, unknown> = { offset, limit };
    if (search.trim()) body['search'] = search.trim();
    if (onlineStatus) body['online_status'] = [onlineStatus];

    stationsApi
      .post<StationsListResponse>('/devices/items/list', { data: body })
      .then((res) => {
        if (cancelled) return;
        setStations(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, search, onlineStatus]);

  return { stations, total, loading, error };
}
