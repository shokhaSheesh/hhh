import { useState, useEffect } from 'react';
import { createApi, VIEW } from '@/api/client';
import type { PortBinding, PortBindingsListResponse } from '@/types/portBindings';

const portBindingsApi = createApi(VIEW.portBindings);

interface UseStationPortsResult {
  ports:   PortBinding[];
  loading: boolean;
  error:   string | null;
}

export function useStationPorts(devicesId: string): UseStationPortsResult {
  const [ports,   setPorts]   = useState<PortBinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    portBindingsApi
      .post<PortBindingsListResponse>('/device_ports/items/list', {
        data: { offset: 0, limit: 200, devices_id: devicesId },
      })
      .then((res) => {
        if (cancelled) return;
        const sorted = (res.data.data.response ?? []).sort((a, b) => a.port - b.port);
        setPorts(sorted);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [devicesId]);

  return { ports, loading, error };
}
