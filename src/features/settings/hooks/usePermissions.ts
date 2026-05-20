import { useState, useEffect, useCallback } from 'react';
import { rootApi, createApi, VIEW } from '@/api/client';
import type {
  Role,
  RolesResponse,
  MenuItem,
  MenusResponse,
  MenuUpdatePayload,
} from '@/types/permissions';

const CLIENT_TYPE_ID = 'dcb8f991-0322-46d4-aae4-40ac45027008';

// Known system roles — used as fallback when the roles API is unreachable
const FALLBACK_ROLES: Role[] = [
  { guid: '8f86b7c3-a73a-4fe6-92ca-ac348313937e', name: 'Super',  is_system: true, status: true, client_type_id: CLIENT_TYPE_ID, client_platform_id: null, project_id: null, created_at: '', updated_at: '', deleted_at: null },
  { guid: '314d9973-c2fd-4c55-b66b-b6d112686da5', name: 'ADMIN',  is_system: true, status: true, client_type_id: CLIENT_TYPE_ID, client_platform_id: null, project_id: null, created_at: '', updated_at: '', deleted_at: null },
  { guid: 'cca5c06b-7846-437c-8fbf-a65f62847940', name: 'VIEWER', is_system: true, status: true, client_type_id: CLIENT_TYPE_ID, client_platform_id: null, project_id: null, created_at: '', updated_at: '', deleted_at: null },
];

async function fetchRoles(): Promise<Role[]> {
  // Try plural form first (/v2/roles), then singular (/v2/role)
  const paths = [
    `/v2/roles?client_type_id=${CLIENT_TYPE_ID}`,
    `/v2/role?client_type_id=${CLIENT_TYPE_ID}`,
  ];

  for (const path of paths) {
    try {
      const res = await rootApi.get<RolesResponse>(path);
      const list = res.data ?? [];
      if (list.length > 0) return list;
    } catch {
      // try next path
    }
  }

  return FALLBACK_ROLES;
}

// ─── Roles ─────────────────────────────────────────────────────────────────────

export function useRoles() {
  const [roles,   setRoles]   = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchRoles()
      .then((list) => {
        if (cancelled) return;
        setRoles(list);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Last-resort: show fallback silently rather than a broken sidebar
        setRoles(FALLBACK_ROLES);
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { roles, loading, error, refetch };
}

export async function createRole(name: string): Promise<Role> {
  const res = await rootApi.post<{ status: string; data: Role }>('/v2/role', {
    name,
    client_type_id: CLIENT_TYPE_ID,
    status: true,
  });
  return res.data;
}

// ─── Menu ACL ──────────────────────────────────────────────────────────────────

const menusApi = createApi(VIEW.admins);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useMenuPermissions(roleId: string | null) {
  const [menus,   setMenus]   = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!roleId || !UUID_RE.test(roleId)) {
      setMenus([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const path = `/admins/items/list?role_id=${roleId}&client_type_id=${CLIENT_TYPE_ID}`;
    console.log('[MenuACL] fetching:', menusApi, path);

    menusApi
      .get<MenusResponse>(path)
      .then((res) => {
        if (cancelled) return;
        setMenus(res.data?.menus ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Noma'lum xatolik");
        setMenus([]);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [roleId, tick]);

  return { menus, loading, error, refetch };
}

export async function updateMenuPermission(payload: MenuUpdatePayload): Promise<void> {
  await rootApi.put('/v1/custom-permission/accesses', payload);
}
