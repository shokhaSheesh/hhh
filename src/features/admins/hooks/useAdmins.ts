import { useState, useEffect } from 'react';
import { createApi, rootApi, VIEW } from '@/api/client';
import type { Admin, AdminsListResponse } from '@/types/admins';

const api = createApi(VIEW.admins);

const ROW_VIEW_ID = '8c4a0ef0-152a-4edf-93eb-9895e5649cc0';

export interface AdminPayload {
  login:          string;
  password?:      string;
  client_type_id: string;
  role_id:        string;
  user_id_auth:   string;
}

export async function createAdmin(data: AdminPayload): Promise<void> {
  await rootApi.post('/v2/items/admins?from-ofs=true', { data, disable_faas: true });
}

export async function updateAdmin(guid: string, data: AdminPayload): Promise<void> {
  const payload = { ...data };
  if (!payload.password) delete payload.password;
  await rootApi.put('/v2/items/admins?from-ofs=true', { data: { guid, ...payload }, disable_faas: true });
}

export async function deleteAdmin(guid: string): Promise<void> {
  await rootApi.delete(`/v2/items/admins/${guid}?from-ofs=true`, { data: { data: {} } });
}

interface UseAdminsResult {
  admins:  Admin[];
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useAdmins(): UseAdminsResult {
  const [admins,  setAdmins]  = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .post<AdminsListResponse>('/admins/items/list', {
        data: {
          row_view_id: ROW_VIEW_ID,
          offset:      0,
          limit:       1000,
          order:       {},
          view_fields: [],
        },
      })
      .then((res) => {
        if (cancelled) return;
        setAdmins(res.data.data.response ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { admins, loading, error, refetch };
}
