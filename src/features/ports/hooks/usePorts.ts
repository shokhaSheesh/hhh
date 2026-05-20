import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { PortBinding, PortBindingsListResponse } from '@/types/portBindings';

const portsApi = createApi(VIEW.portBindings);

interface UsePortsOptions {
  page:   number;
  limit:  number;
  search: string;
}

interface UsePortsResult {
  ports:   PortBinding[];
  total:   number;
  loading: boolean;
  error:   string | null;
}

export function usePorts({ page, limit, search }: UsePortsOptions): UsePortsResult {
  const [ports,   setPorts]   = useState<PortBinding[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const offset = (page - 1) * limit;
    const body: Record<string, unknown> = { offset, limit };
    if (search.trim()) body['search'] = search.trim();

    portsApi
      .post<PortBindingsListResponse>('/device_ports/items/list', { data: body })
      .then((res) => {
        if (cancelled) return;
        setPorts(res.data.data.response ?? []);
        setTotal(res.data.data.count ?? 0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, search]);

  return { ports, total, loading, error };
}
