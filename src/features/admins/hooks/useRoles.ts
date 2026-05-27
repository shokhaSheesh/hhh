import { useState, useEffect } from 'react';
import { authApi } from '@/api/client';

export interface Role {
  guid:           string;
  name:           string;
  client_type_id: string;
  project_id?:    string;
}

interface RolesResponse {
  status: string;
  data: {
    data: {
      count:    number;
      response: Role[];
    };
  };
}

export function useRoles() {
  const [roles,   setRoles]   = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    authApi
      .get<RolesResponse>('/v2/role')
      .then((res) => {
        if (cancelled) return;
        setRoles(res.data?.data?.response ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Rollarni yuklashda xatolik');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { roles, loading, error };
}
