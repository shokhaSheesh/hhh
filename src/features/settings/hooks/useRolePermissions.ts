import { useState, useEffect } from 'react';
import { rootApi } from '@/api/client';

export interface PermissionItem {
  custom_permission_id: string;
  title:                string;
  attributes:           { description?: string };
  read:                 'Yes' | 'No';
  write:                'Yes' | 'No';
  update:               'Yes' | 'No';
  delete:               'Yes' | 'No';
}

interface AccessesResponse {
  status: string;
  data:   { permissions: PermissionItem[] };
}

export type PermField = 'read' | 'write' | 'update' | 'delete';

export async function updateAccess(
  roleId:       string,
  clientTypeId: string,
  item:         PermissionItem,
): Promise<void> {
  await rootApi.put<unknown>(
    `/v1/custom-permission/accesses`,
    {
      role_id:              roleId,
      client_type_id:       clientTypeId,
      custom_permission_id: item.custom_permission_id,
      read:                 item.read,
      write:                item.write,
      update:               item.update,
      delete:               item.delete,
    },
  );
}

export function useRolePermissions(
  roleId:       string | null,
  clientTypeId: string | null,
) {
  const [items,   setItems]   = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!roleId || !clientTypeId) { setItems([]); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const qs = `?role_id=${roleId}&client_type_id=${clientTypeId}&parent_id=`;

    rootApi
      .get<AccessesResponse>(`/v1/custom-permission/accesses${qs}`)
      .then((res) => {
        if (cancelled) return;
        setItems(res.data?.permissions ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Ruxsatnomalarni yuklashda xatolik');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [roleId, clientTypeId]);

  return { items, setItems, loading, error };
}
