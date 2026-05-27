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

    const q = search.trim().toLowerCase();
    // API ignores search field — fetch all and filter client-side when searching
    const body = q
      ? { offset: 0, limit: 2000 }
      : { offset: (page - 1) * limit, limit };

    portsApi
      .post<PortBindingsListResponse>('/device_ports/items/list', { data: body })
      .then((res) => {
        if (cancelled) return;
        const all = res.data.data.response ?? [];
        if (q) {
          const filtered = all.filter((p) => {
            const sn   = p.batteries_id_data?.battery_sn.toLowerCase() ?? '';
            const name = p.devices_id_data?.device_name.toLowerCase()  ?? '';
            const code = p.devices_id_data?.device_code.toLowerCase()  ?? '';
            const port = String(p.port);
            return sn.includes(q) || name.includes(q) || code.includes(q) || port.includes(q);
          });
          setPorts(filtered.slice((page - 1) * limit, page * limit));
          setTotal(filtered.length);
        } else {
          setPorts(all);
          setTotal(res.data.data.count ?? 0);
        }
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
