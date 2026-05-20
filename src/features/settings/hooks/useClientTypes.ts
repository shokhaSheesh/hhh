import { useState, useEffect } from 'react';
import { authApi } from '@/api/client';

export interface ClientType {
  guid:               string;
  name:               string;
  project_id:         string | null;
  table_slug:         string | null;
  is_system:          boolean;
  confirm_by:         string;
  self_register:      boolean;
  self_recover:       boolean;
  session_limit:      number;
  default_page:       string | null;
  client_platform_ids: string[] | null;
}

interface ClientTypesResponse {
  status: string;
  data: {
    data: {
      count:    number;
      response: ClientType[];
    };
  };
}

export function useClientTypes() {
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    authApi
      .get<ClientTypesResponse>('/v2/client-type')
      .then((res) => {
        if (cancelled) return;
        setClientTypes(res.data.data.response ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Client turlarini yuklashda xatolik');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { clientTypes, loading, error };
}
